import './style.css';
import '@xterm/xterm/css/xterm.css';
import { LogsIcon } from 'lucide-react';
import { Fragment, useRef, useState } from 'react';
import { ThemeSelector } from './theme-selector';
import { Xterm } from './xterm';

export function App() {
	const portalEl = useRef(null);
	const [sortedColors, setSortedColors] = useState(
		JSON.parse(window.localStorage.getItem('sortedColors') || 'false'),
	);

	return (
		<div className="h-screen w-screen overflow-hidden">
			<div className="tabs tabs-lift flex rounded-none pt-1 bg-base-300 relative w-full h-[calc(100%-10vh)]">
				<div className="title-bar min-w-50 grow" />

				{window.api.terminals.map((terminal) => (
					<Fragment key={terminal.id}>
						<input
							type="radio"
							name="tab"
							className="tab border-none"
							aria-label={terminal.name}
						/>
						<div className="tab-content size-full border-none bg-base-100 border-base-300 p-6 rounded-none">
							<Xterm terminals={[terminal]} portalEl={portalEl} />
						</div>
					</Fragment>
				))}

				<label className="tab border-none mr-1">
					<input type="radio" name="tab" defaultChecked />
					<LogsIcon size={15} className="mr-1" />
					All
				</label>
				<div className="tab-content size-full border-none bg-base-100 border-base-300 p-6 rounded-none">
					<Xterm
						terminals={window.api.terminals}
						portalEl={portalEl}
						sortedColors={sortedColors}
						setSortedColors={setSortedColors}
						aggregated
					/>
				</div>
			</div>
			<div className="flex py-1 justify-between items-center bg-base-300 px-2 h-auto absolute bottom-0 w-full">
				<div ref={portalEl} />
				<ThemeSelector />
			</div>
		</div>
	);
}
