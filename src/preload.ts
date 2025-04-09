import { contextBridge, ipcRenderer } from 'electron';
import type { Arg } from './types';

const createInstance = (id: string, config: Arg) => {
	let isRunning = false;

	return {
		start: async () => {
			if (!isRunning) {
				await ipcRenderer.invoke('start-terminal', { id, ...config });
			}
		},
		stop: async () => {
			if (isRunning) {
				await ipcRenderer.invoke('stop-terminal', id);
			}
		},
		onStatusChange: (cb: (running: boolean) => void) => {
			ipcRenderer.on(`running:${id}`, () => {
				cb(true);
				isRunning = true;
			});
			ipcRenderer.on(`stopped:${id}`, () => {
				cb(false);
				isRunning = false;
			});
		},
		onOutput: (cb: (data: string) => void) => {
			ipcRenderer.on(`output:${id}`, (_event, data) => cb(data));
		},
		input: (data: string) => {
			ipcRenderer.send(`input:${id}`, data);
		},
		resize: (data: { cols: number; rows: number }) => {
			ipcRenderer.send(`resize:${id}`, data);
		},
	};
};

const args = ipcRenderer.sendSync('get-args') as Arg[];
const terminals = args.map((arg, idx) => {
	const id = `${idx}-${arg.path}-${arg.cmd}`;
	const name = arg.name ?? `${arg.path} ${arg.cmd}`;
	const instance = createInstance(id, arg);

	return { ...arg, idx, id, name, instance };
});

const openLink = (uri: string) => {
	ipcRenderer.send('open-link', uri);
};

const api = { terminals, openLink };

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
