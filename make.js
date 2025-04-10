// make.js
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const builds = [
	{ platform: 'darwin', arch: 'arm64' },
	{ platform: 'darwin', arch: 'x64' },
	{ platform: 'linux', arch: 'arm64' },
	{ platform: 'linux', arch: 'x64' },
	{ platform: 'win32', arch: 'arm64' },
	{ platform: 'win32', arch: 'x64' },
];

function generateTempDir(platform, arch) {
	const uuid = randomUUID();
	const tempDir = path.join(os.tmpdir(), `ep-${platform}-${arch}-${uuid}`);
	fs.mkdirSync(tempDir, { recursive: true });
	return tempDir;
}

function runBuild({ platform, arch }) {
	return new Promise((resolve, reject) => {
		const log = [];
		const tempDir = generateTempDir(platform, arch);
		log.push(`[${platform}-${arch}] Using temp dir: ${tempDir}`);

		const args = ['run', 'make', '--platform', platform, '--arch', arch];
		const child = spawn('npm', args, {
			shell: true,
			env: {
				...process.env,
				ELECTRON_PACKAGER_TMPDIR: tempDir,
			},
		});

		child.stdout.on('data', (data) =>
			log.push(`[${platform}-${arch}] ${data.toString().trim()}`),
		);
		child.stderr.on('data', (data) =>
			log.push(`[${platform}-${arch}][stderr] ${data.toString().trim()}`),
		);

		child.on('close', (code) => {
			if (code !== 0) {
				reject({ platform, arch, code, log: log.join('\n') });
			} else {
				// Clean up temp directory
				fs.rmSync(tempDir, { recursive: true, force: true });
				resolve({ platform, arch, log: log.join('\n') });
			}
		});
	});
}

(async () => {
	console.log('🚀 Running parallel builds...\n');

	try {
		const results = await Promise.all(builds.map(runBuild));

		for (const result of results) {
			console.log(`\n--- Logs for ${result.platform} (${result.arch}) ---\n`);
			console.log(result.log);
		}

		console.log('\n📦 All builds completed successfully!\n');
	} catch (error) {
		console.error(`\n❌ Build failed for ${error.platform} (${error.arch})`);
		console.error(`Exit code: ${error.code}\n`);
		console.error('--- Full log ---\n');
		console.error(error.log);
		process.exit(1);
	}
})();
