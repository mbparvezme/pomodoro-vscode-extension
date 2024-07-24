import * as vscode from 'vscode';

interface Config {
	promodoroDuration: number;
	shortBreakDuration: number;
	longBreakDuration: number;
	promodoroClock: boolean;
}

let config: Config;
let ctx: vscode.ExtensionContext;
let promodoroCount = 0;
let promodoroInterval: NodeJS.Timeout | undefined;
let promodoroStatusBar: vscode.StatusBarItem;

// Initialize the extension and configuration
const ini = (context: vscode.ExtensionContext, update: boolean = false) => {
	const userConfig = vscode.workspace.getConfiguration('promodoro');
	config = {
		promodoroDuration: userConfig.get<number>('promodoroDuration', 25) * 60, // convert to seconds
		shortBreakDuration: userConfig.get<number>('shortBreakDuration', 5) * 60, // convert to seconds
		longBreakDuration: userConfig.get<number>('longBreakDuration', 20) * 60, // convert to seconds
		promodoroClock: userConfig.get<boolean>('promodoroClock', true)
	};
	ctx = context;
	if (!update) {
		promodoroStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		promodoroStatusBar.show();
	}
};

// Start the Promodoro timer
const startPromodoroTimer = () => {
	let secondsRemaining = config.promodoroDuration;
	updateStatusBar(secondsRemaining, false);

	if (promodoroCount % 4 === 0) {
		promodoroCount = 0;
	}

	promodoroInterval = setInterval(() => {
		secondsRemaining--;
		updateStatusBar(secondsRemaining, false);

		if (secondsRemaining <= 0) {
			clearInterval(promodoroInterval);
			promodoroCount++;
			vscode.window.showInformationMessage(makeNotification(), 'Hello');
			startBreak();
		}
	}, 1000);
};

// Start the break timer
const startBreak = () => {
	const isLongBreak = promodoroCount % 4 === 0;
	let secondsRemaining = isLongBreak ? config.longBreakDuration : config.shortBreakDuration;
	updateStatusBar(secondsRemaining, true);

	promodoroInterval = setInterval(() => {
		secondsRemaining--;
		updateStatusBar(secondsRemaining, true);

		if (secondsRemaining <= 0) {
			clearInterval(promodoroInterval);
			vscode.window.showInformationMessage('Break is over! Time to get back to work.');
			startPromodoroTimer();
		}
	}, 1000);

	if (isLongBreak) {
		promodoroCount = 0;
	}
};

// Stop the Promodoro timer
const stopPromodoroTimer = () => {
	if (promodoroInterval) {
		clearInterval(promodoroInterval);
		promodoroStatusBar.text = 'Promodoro stopped';
	}
};

// Update the status bar with the remaining time
const updateStatusBar = (secondsRemaining: number, isBreak: boolean = false) => {
	const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
	const seconds = (secondsRemaining % 60).toString().padStart(2, '0');
	promodoroStatusBar.text = makeStatusBarText(minutes, seconds, isBreak);
	const color = isBreak ? new vscode.ThemeColor('promodoro.breakTextColor') : new vscode.ThemeColor('statusBar.foreground');
	promodoroStatusBar.color = color;
};

// Get the readable number for Promodoro count
const readableNumber = (custom: boolean = true) => {
	switch (promodoroCount) {
		case 1: return '1st';
		case 2: return '2nd';
		case 3: return '3rd';
		default: return custom ? 'Long' : '4th';
	}
};

// Create the text for the status bar
const makeStatusBarText = (m: string, s: string, isBreak: boolean = false): string =>
	`${isBreak ? '🛑' : '💼'} ${isBreak ? `${readableNumber()} Break` : 'Work'} ${config.promodoroClock ? `Time: ${m}:${s}` : 'Time'}`;

// Create the notification message
const makeNotification = (): string =>
	`${readableNumber(false)} Promodoro completed! Time for a ${promodoroCount % 4 !== 0 ? "short" : `${config.longBreakDuration / 60}min`} break.`;

// Activate the extension
export const activate = (context: vscode.ExtensionContext) => {
	console.log("Extension activated!");
	ini(context);

	context.subscriptions.push(vscode.commands.registerCommand('promodoro.startPromodoro', startPromodoroTimer));
	context.subscriptions.push(vscode.commands.registerCommand('promodoro.stopPromodoro', stopPromodoroTimer));
	context.subscriptions.push(promodoroStatusBar);
	vscode.workspace.onDidChangeConfiguration(() => ini(context, true));

	startPromodoroTimer();
};

// Deactivate the extension
export const deactivate = () => {
	if (promodoroInterval) {
		clearInterval(promodoroInterval);
	}
	console.log("Extension deactivated!");
};
