import { app, ipcMain, BrowserWindow } from 'electron';
import { join } from 'node:path';
import started from 'electron-squirrel-startup';
import type PTY from 'node-pty';
import type { Arg } from './types';
import { parseArgs, parseCmd } from './utils';
import { shell } from 'electron';

const ptyPath = app.isPackaged
	? join(process.resourcesPath, 'node-pty')
	: 'node-pty';

const pty = require(ptyPath) as typeof PTY;
const args = parseArgs();
const instances = new Map<string, PTY.IPty>();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1024,
		height: 800,
		// remove the default titlebar
		titleBarStyle: 'hidden',
		// expose window controlls in Windows/Linux
		...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
		trafficLightPosition: { x: 10, y: 14.5 },
		webPreferences: {
			contextIsolation: true,
			sandbox: true,
			preload: join(__dirname, 'preload.js'),
		},
	});

	ipcMain.on('get-args', (event) => {
		event.returnValue = args;
	});

	ipcMain.on('open-link', (_event, uri) => {
		shell.openExternal(uri);
	});

	ipcMain.handle(
		'start-terminal',
		async (_event, arg: Arg & { id: string }) => {
			if (instances.has(arg.id)) {
				mainWindow.webContents.send(`running:${arg.id}`);
				return;
			}

			const [cmdProgram, ...cmdArgs] = parseCmd(arg.cmd);
			const term = pty.spawn(cmdProgram, cmdArgs, {
				name: `runall-${arg.id}`,
				cwd: arg.path,
				env: {
					...process.env,
					FORCE_COLOR: '1',
				},
			});

			term.onData((data) => {
				mainWindow.webContents.send(`output:${arg.id}`, data);
			});

			ipcMain.on(`input:${arg.id}`, (_event, input) => {
				term.write(input);
			});

			ipcMain.on(`resize:${arg.id}`, (_event, cols, rows) => {
				if (cols && rows && cols > 0 && rows > 0) {
					term.resize(cols, rows);
				}
			});

			instances.set(arg.id, term);
			mainWindow.webContents.send(`running:${arg.id}`);
		},
	);

	ipcMain.handle('stop-terminal', (_event, id) => {
		const term = instances.get(id);
		if (term) {
			term.kill();
			instances.delete(id);
			ipcMain.removeAllListeners(`input:${id}`);
			ipcMain.removeAllListeners(`resize:${id}`);
			mainWindow.webContents.send(`stopped:${id}`);
		}
	});

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
		);
	}

	if (process.env.DEVTOOLS) {
		mainWindow.webContents.openDevTools();
	}
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.on('web-contents-created', (_event, contents) => {
	contents.on('will-navigate', (event) => {
		event.preventDefault();
	});
});

function shutdown() {
	for (const term of instances.values()) {
		term.kill();
	}

	instances.clear();
}

app.on('quit', shutdown);
process.on('exit', shutdown);
process.on('SIGINT', shutdown);
