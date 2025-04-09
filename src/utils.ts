import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { app, dialog } from 'electron';
import type { Arg } from 'src/types';
import yaml from 'yaml';
import yargs from 'yargs';

export function abort(message: string) {
	dialog.showErrorBox('Something went wrong', message);
	app.quit();
}

export function parseArgs() {
	const argv = yargs(process.argv.slice(process.defaultApp ? 2 : 1))
		.argv as yargs.Arguments;

	const fromProcess = argv._.map<Arg>((arg) => {
		const parts = arg.toString().split('@');
		let path = parts[0];
		let cmd = parts[1];

		if (!path || !cmd) {
			abort(`Invalid argument: ${arg}`);
		}

		if (path.match(/^'(.+)'$/) || path.match(/^"(.+)"$/)) {
			path = path.slice(1, -1);
		}

		if (cmd.match(/^'(.+)'$/) || cmd.match(/^"(.+)"$/)) {
			cmd = cmd.slice(1, -1);
		}

		return { path, cmd };
	});

	if (fromProcess.length) return fromProcess;
	const cwd = (argv.cwd as string | undefined) ?? process.cwd();

	const getConfigPath = () => {
		const configFromFlag = argv.config ?? argv.c;
		if (configFromFlag) {
			const fromFlagResolved = resolve(cwd, configFromFlag.toString());
			if (existsSync(fromFlagResolved)) {
				return fromFlagResolved;
			}
		}

		const defaultYaml = resolve(cwd, './run.config.yaml');
		if (existsSync(defaultYaml)) {
			return defaultYaml;
		}

		const defaultYml = resolve(cwd, './run.config.yml');
		if (existsSync(defaultYml)) {
			return defaultYml;
		}

		const defaultJson = resolve(cwd, './run.config.json');
		if (existsSync(defaultJson)) {
			return defaultJson;
		}

		return undefined;
	};

	const configPath = getConfigPath();
	if (configPath) {
		let config: Arg[] | null = null;

		try {
			const fileContent = readFileSync(configPath, 'utf8');
			if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
				config = yaml.parse(fileContent);
			} else {
				config = JSON.parse(fileContent);
			}
		} catch (error) {
			const fileType =
				configPath.endsWith('.yaml') || configPath.endsWith('.yml')
					? 'YAML'
					: 'JSON';
			abort(`Invalid ${fileType} in config file`);
		}

		if (!Array.isArray(config)) {
			abort('Invalid config file. Expected an array.');
		}

		for (const arg of config) {
			if (!arg || typeof arg !== 'object') {
				abort('Invalid config file. Expected an array of objects.');
			}

			if (!arg.path) {
				abort(`Invalid config file. Argument ${arg} is missing a path.`);
			}

			if (!arg.cmd) {
				abort(`Invalid config file. Argument ${arg} is missing a cmd.`);
			}
		}

		return config;
	}

	abort('No arguments provided and the config file was not found.');
}

export function parseCmd(input: string) {
	const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
	const args = [];
	let match: string[];

	while ((match = regex.exec(input)) !== null) {
		if (match[1] !== undefined) {
			args.push(match[1]); // Double-quoted argument
		} else if (match[2] !== undefined) {
			args.push(match[2]); // Single-quoted argument
		} else {
			args.push(match[0]); // Unquoted argument
		}
	}

	return args;
}
