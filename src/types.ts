import type { Api } from './preload';

export type Arg = {
	name?: string;
	path: string;
	cmd: string;
};

declare global {
	interface Window {
		api: Api;
	}
}
