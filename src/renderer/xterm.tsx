import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useIntersection, useWindowSize } from 'react-use';
import type { Api } from '../preload';
import { useXtermThemeSync } from './use-xterm-theme-sync';
import chalk from 'chalk';
import { Portal } from './portal';
import { PaintBucketIcon, PlayIcon, SquareIcon } from 'lucide-react';
import Color from 'colorjs.io';

export type Props = {
	terminals: Api['terminals'];
	portalEl?: React.RefObject<HTMLDivElement>;
	sortedColors?: boolean;
	setSortedColors?: (value: boolean) => void;
	aggregated?: boolean;
};

export function Xterm(props: Props) {
	const [tabIsActive, setTabIsActive] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const terminalRef = useRef<HTMLDivElement>(null);
	const xtermInstance = useRef<Terminal>(null);
	const fitAddonInstance = useRef<FitAddon>(null);
	const windowSize = useWindowSize();
	const intersection = useIntersection(terminalRef, {
		root: null,
		rootMargin: '0px',
		threshold: 0.1,
	});

	const theme = useXtermThemeSync(xtermInstance.current);
	const accentColors = useRef<[string, string][]>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies(theme): Should refresh accent colors on theme change
	useEffect(() => {
		const colors: [string, string][] = [];
		for (const { idx } of props.terminals) {
			if (props.sortedColors) {
				colors.push(getAccentColors(idx));
				continue;
			}

			colors.push(getAccentColors());
		}

		accentColors.current = colors;
	}, [theme, props.terminals, props.sortedColors]);

	useEffect(() => {
		const fitAddon = new FitAddon();
		const searchAddon = new SearchAddon();
		const webLinksAddon = new WebLinksAddon((_event, uri) =>
			window.api.openLink(uri),
		);
		const xterm = new Terminal({
			cursorBlink: !props.aggregated,
			disableStdin: props.aggregated,
			cursorStyle: 'underline',
		});

		xterm.loadAddon(fitAddon);
		xterm.loadAddon(searchAddon);
		xterm.loadAddon(webLinksAddon);

		for (const { idx, name, instance } of props.terminals) {
			if (!props.aggregated) {
				xterm.onData(instance.input);
			}

			xterm.onResize(instance.resize);
			instance.onOutput((data) => {
				const [accentBg, accentFg] =
					accentColors.current[idx] ?? getAccentColors();
				if (props.aggregated) {
					xterm.write(
						`${chalk.bgHex(accentBg).hex(accentFg).italic(` ${name} `)} `,
					);
				}

				xterm.write(data);
			});

			instance.onStatusChange((status) => {
				const [accentBg, accentFg] =
					accentColors.current[idx] ?? getAccentColors();
				if (props.aggregated) {
					if (!status) {
						xterm.write(
							`${chalk.bgHex(accentBg).hex(accentFg).italic(` ${name} `)} `,
						);
						xterm.writeln(chalk.bgHex(accentBg).hex(accentFg)(' ⏹ STOPPED '));
					}
				} else {
					setIsRunning(status);
					if (!status) {
						xterm.writeln(chalk.bgHex(accentBg).hex(accentFg)(' ⏹ STOPPED '));
					}
				}
			});

			if (terminalRef.current) {
				xterm.open(terminalRef.current);
				setTimeout(() => {
					instance.start();
				}, 500);
			}
		}

		if (props.aggregated) {
			xterm.textarea.disabled = true;
		}

		xtermInstance.current = xterm;
		fitAddonInstance.current = fitAddon;

		return () => {
			xterm.dispose();
			xtermInstance.current = null;
		};
	}, [props.terminals, props.aggregated]);

	useEffect(() => {
		const isVisible = !!intersection?.isIntersecting;
		if (isVisible) {
			fitAddonInstance.current?.fit();
		}

		setTabIsActive(isVisible);
	}, [intersection]);

	// biome-ignore lint/correctness/useExhaustiveDependencies(windowSize): Should trigger fit on window size change
	useEffect(() => {
		const timeout = setTimeout(() => {
			fitAddonInstance.current?.fit();
		}, 300);
		return () => clearTimeout(timeout);
	}, [windowSize]);

	return (
		<>
			<div
				style={{ backgroundColor: theme?.background }}
				className="rounded-sm p-2 relative size-full"
			>
				<div className="size-full" ref={terminalRef} />
			</div>
			<Portal container={props.portalEl.current}>
				{!props.aggregated && tabIsActive && (
					<button
						type="button"
						className="btn btn-circle btn-sm btn-ghost"
						onClick={() => {
							const method = isRunning ? 'stop' : 'start';
							props.terminals[0]?.instance[method]();
						}}
					>
						{isRunning ? <SquareIcon size={16} /> : <PlayIcon size={16} />}
					</button>
				)}
				{props.sortedColors !== undefined &&
					props.setSortedColors !== undefined &&
					tabIsActive && (
						<button
							type="button"
							className={[
								'btn',
								'btn-circle',
								'btn-sm',
								'btn-ghost',
								props.sortedColors ? 'opacity-100' : 'opacity-20',
								'hover:opacity-100',
							]
								.filter(Boolean)
								.join(' ')}
							onClick={() => {
								const newValue = !props.sortedColors;
								props.setSortedColors(newValue);
								window.localStorage.setItem(
									'sortedColors',
									newValue.toString(),
								);
							}}
						>
							<PaintBucketIcon size={16} />
						</button>
					)}
			</Portal>
		</>
	);
}

function getAccentColors(idx?: number): [string, string] {
	if (idx !== undefined) {
		return [tailwindBgHex700[idx] ?? 'bg-black', '#ffffff'];
	}

	const root = document.documentElement;

	const bg = new Color(
		getComputedStyle(root).getPropertyValue('--color-base-content').trim(),
	)
		.to('srgb')
		.toString({ format: 'hex' });

	const fg = new Color(
		getComputedStyle(root).getPropertyValue('--color-base-200').trim(),
	)
		.to('srgb')
		.toString({ format: 'hex' });

	return [bg, fg];
}

const tailwindBgHex700 = [
	'#1d4ed8', // blue-700
	'#0f766e', // teal-700
	'#6d28d9', // violet-700
	'#c2410c', // orange-700
	'#0369a1', // sky-700
	'#a21caf', // fuchsia-700
	'#4d7c0f', // lime-700
	'#4338ca', // indigo-700
	'#be185d', // pink-700
	'#15803d', // green-700
	'#0e7490', // cyan-700
	'#be123c', // rose-700
	'#b45309', // amber-700
	'#6b21a8', // purple-700
	'#047857', // emerald-700
	'#374151', // gray-700
	'#a16207', // yellow-700
	'#b91c1c', // red-700
];
