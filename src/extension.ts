import * as vscode from 'vscode';
import { exec } from 'child_process';

// Interface for configuration settings
interface Config {
	pomodoroDuration: number;   // Duration of the Pomodoro session in seconds
	shortBreakDuration: number; // Duration of a short break in seconds
	longBreakDuration: number;  // Duration of a long break in seconds
	pomodoroClock: boolean;      // Whether to display the clock in the status bar
}

let config: Config;
let ctx: vscode.ExtensionContext;
let pomodoroCount = 0; // Counter to track completed Pomodoros
let pomodoroInterval: NodeJS.Timeout | undefined; // Timer for Pomodoro or break
let pomodoroStatusBar: vscode.StatusBarItem; // Status bar item for displaying Pomodoro timer

/**
 * Initializes the extension and loads configuration settings.
 * 
 * @param update - Whether to reinitialize the status bar item. Defaults to false.
 */
const initialize = (update: boolean = false) => {
	const userConfig = vscode.workspace.getConfiguration('pomodoro');
	config = {
		pomodoroDuration: userConfig.get<number>('pomodoroDuration', .125) * 60, // Convert hours to seconds
		shortBreakDuration: userConfig.get<number>('shortBreakDuration', .125) * 60, // Convert hours to seconds
		longBreakDuration: userConfig.get<number>('longBreakDuration', .25) * 60, // Convert hours to seconds
		pomodoroClock: userConfig.get<boolean>('pomodoroClock', true)
	};

	if (!update) {
		// Create and show the status bar item with a priority of 100
		pomodoroStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		pomodoroStatusBar.tooltip = `${readableNumber(pomodoroCount + 1, true)} phase!`;
		pomodoroStatusBar.show();
	}
};

/**
 * Starts the Pomodoro timer.
 * Initializes the timer and updates the status bar. Handles completion and transitions to break.
 */
const startPomodoroTimer = () => {
	let secondsRemaining = config.pomodoroDuration;
	updateStatusBar(secondsRemaining, false);

	// Reset pomodoroCount after every 4 Pomodoros
	if (pomodoroCount % 4 === 0) {
		pomodoroCount = 0;
	}

	// Update the status bar every second
	pomodoroInterval = setInterval(() => {
		secondsRemaining--;
		updateStatusBar(secondsRemaining, false);

		if (secondsRemaining <= 0) {
			clearInterval(pomodoroInterval);
			pomodoroCount++;
			// playBeep(); // Play beep sound to indicate Pomodoro end
			showTimedInformationMessage(makeNotification(), 2000); // Show notification for 2 seconds
			startBreak(); // Start the break timer
		}
	}, 1000);
};

/**
 * Starts the break timer.
 * Determines if it's a long break or short break and initializes the timer. Handles completion and transitions to the next Pomodoro.
 */
const startBreak = () => {
	const isLongBreak = pomodoroCount % 4 === 0;
	let secondsRemaining = isLongBreak ? config.longBreakDuration : config.shortBreakDuration;
	updateStatusBar(secondsRemaining, true);

	// playBeep(); // Play beep sound to indicate break start

	// Update the status bar every second
	pomodoroInterval = setInterval(() => {
		secondsRemaining--;
		updateStatusBar(secondsRemaining, true);

		if (secondsRemaining <= 0) {
			clearInterval(pomodoroInterval);
			// playBeep(); // Play beep sound to indicate break end
			showTimedInformationMessage('🟢 Break is over! Time to get back to work.', 2000); // Show notification for 2 seconds
			startPomodoroTimer(); // Restart the Pomodoro timer
		}
	}, 1000);

	// Reset pomodoroCount after a long break
	if (isLongBreak) {
		pomodoroCount = 0;
	}
};

/**
 * Stops the Pomodoro timer.
 * Clears the active timer and updates the status bar to indicate that the Pomodoro has stopped.
 */
const stopPomodoroTimer = () => {
	if (pomodoroInterval) {
		clearInterval(pomodoroInterval); // Stop the timer
		pomodoroStatusBar.text = 'Pomodoro stopped'; // Update status bar text
	}
};

/**
 * Updates the status bar with the remaining time.
 * 
 * @param secondsRemaining - The remaining time in seconds.
 * @param isBreak - Whether the current timer is for a break. Defaults to false.
 */
const updateStatusBar = (secondsRemaining: number, isBreak: boolean = false) => {
	const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
	const seconds = (secondsRemaining % 60).toString().padStart(2, '0');
	pomodoroStatusBar.text = makeStatusBarText(minutes, seconds, isBreak);
	const color = isBreak ? new vscode.ThemeColor('pomodoro.breakTextColor') : new vscode.ThemeColor('statusBar.foreground');
	pomodoroStatusBar.color = color;
};

/**
 * Returns a readable string for the Pomodoro count.
 * 
 * @param custom - Whether to return a custom string for "Long" break. Defaults to true.
 * @returns A string representing the Pomodoro count or "Long" for long breaks.
 */
const readableNumber = (pc: number, custom: boolean = true) => {
	switch (pc) {
		case 1: return '1st';
		case 2: return '2nd';
		case 3: return '3rd';
		default: return custom ? 'Long' : '4th';
	}
};

/**
 * Creates the text for the status bar.
 * 
 * @param m - Minutes remaining in the timer.
 * @param s - Seconds remaining in the timer.
 * @param isBreak - Whether the timer is for a break. Defaults to false.
 * @returns A formatted string for the status bar text.
 */
const makeStatusBarText = (m: string, s: string, isBreak: boolean = false): string =>
	`${isBreak ? '🔴' : '🟢'} ${isBreak ? `${readableNumber(pomodoroCount)} Break` : 'Work'} ${config.pomodoroClock ? `Time: ${m}:${s}` : 'Time'}`;

/**
 * Displays an information message in a VSCode notification for a specified duration.
 * 
 * @param message - The message to display in the notification.
 * @param duration - The duration (in milliseconds) to display the notification. Defaults to 3000ms (3 seconds).
 */
const showTimedInformationMessage = (message: string, duration: number = 3000) => {
	vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: message,
			cancellable: false
		},
		(progress, token) => {
			return new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve(); // Resolve promise after duration to dismiss notification
				}, duration);
			});
		}
	);
};

/**
 * Creates the notification message for Pomodoro completion.
 * 
 * @returns A string representing the notification message with the Pomodoro count and break duration.
 */
const makeNotification = (): string =>
	`🔴 ${readableNumber(pomodoroCount, false)} Pomodoro completed! Time for a ${pomodoroCount % 4 !== 0 ? "short" : `${config.longBreakDuration / 60}min`} break.`;

/**
 * Plays a system beep sound.
 * Executes a platform-specific command to play a beep sound.
 */
const playBeep = () => {
	const platform = process.platform;
	const command = platform === 'win32' ? 'echo \x07' : 'echo -e "\a"';
	exec(command, (error) => {
		if (error) {
			console.error('Error playing beep sound:', error); // Log error if beep fails
		}
	});
};

// Activate the extension
export const activate = (context: vscode.ExtensionContext) => {
	console.log("Extension activated!");
	ctx = context;
	initialize(); // Initialize extension settings

	// Register commands and status bar item
	context.subscriptions.push(vscode.commands.registerCommand('pomodoro.startPomodoro', startPomodoroTimer));
	context.subscriptions.push(vscode.commands.registerCommand('pomodoro.stopPomodoro', stopPomodoroTimer));
	context.subscriptions.push(pomodoroStatusBar);
	vscode.workspace.onDidChangeConfiguration(() => initialize(true)); // Reinitialize on configuration change

	startPomodoroTimer(); // Start the Pomodoro timer initially
};

// Deactivate the extension
export const deactivate = () => {
	if (pomodoroInterval) {
		clearInterval(pomodoroInterval); // Clear the timer on deactivation
	}
	console.log("Extension deactivated!");
};
