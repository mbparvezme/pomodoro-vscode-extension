import * as vscode from 'vscode';
import { exec } from 'child_process';

interface Config {
	pomodoroDuration: number;   // Duration of the Pomodoro session in seconds
	shortBreakDuration: number; // Duration of a short break in seconds
	longBreakDuration: number;  // Duration of a long break in seconds
	pomodoroClock: boolean;      // Whether to display the clock in the status bar
}

let config: Config;
let ctx: vscode.ExtensionContext;
let pomodoroStatus: boolean = false; // Indicates if the Pomodoro timer is currently running
let pomodoroPaused: boolean = false; // Indicates if the Pomodoro timer is currently paused
let pomodoroCount = 0; // Counter to track completed Pomodoros
let pomodoroInterval: NodeJS.Timeout | undefined; // Timer for Pomodoro or break
let pomodoroStatusBar: vscode.StatusBarItem; // Status bar item for displaying Pomodoro timer

// Track click events to distinguish between single and double clicks
let clickTimeout: NodeJS.Timeout | undefined;
const clickDelay = 250; // Delay to detect double click (milliseconds)
let secondsRemaining: number; // Variable to track the remaining seconds of the current Pomodoro or break

/**
 * Initializes the extension and loads configuration settings.
 * 
 * @param update - Whether to reinitialize the status bar item. Defaults to false.
 */
const initialize = (update: boolean = false) => {
	const userConfig = vscode.workspace.getConfiguration('pomodoro');
	config = {
		pomodoroDuration: userConfig.get<number>('pomodoroDuration', 25) * 60, // Convert hours to seconds
		shortBreakDuration: userConfig.get<number>('shortBreakDuration', 5) * 60, // Convert hours to seconds
		longBreakDuration: userConfig.get<number>('longBreakDuration', 20) * 60, // Convert hours to seconds
		pomodoroClock: userConfig.get<boolean>('pomodoroClock', true)
	};

	if (!update) {
		// Create and show the status bar item with a priority of 100
		pomodoroStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		pomodoroStatusBar.tooltip = 'Click to toggle Pomodoro (single click to pause/start, double click to restart)'; // Set initial tooltip
		pomodoroStatusBar.show();
		pomodoroStatusBar.command = 'pomodoro.toggle'; // Set command for status bar item
	}
};

/**
 * Handles click events on the status bar item.
 * Differentiates between single and double clicks to toggle or restart the Pomodoro timer.
 */
const handleClick = () => {
	if (clickTimeout) {
		clearTimeout(clickTimeout); // Clear existing timeout if it's a double click
		clickTimeout = undefined;
		restartPomodoroTimer(); // Restart Pomodoro on double click
	} else {
		clickTimeout = setTimeout(() => {
			clickTimeout = undefined;
			togglePomodoroTimer(); // Toggle timer on single click
		}, clickDelay);
	}
};

/**
 * Toggles the Pomodoro timer between start and pause.
 */
const togglePomodoroTimer = () => {
	if (pomodoroPaused) {
		// If the timer is paused, resume it
		startPomodoroTimer(secondsRemaining);
		pomodoroPaused = false;
	} else if (pomodoroInterval) {
		// If the timer is running, pause it
		stopPomodoroTimer();
		pomodoroPaused = true;
	} else {
		// If the timer is not running, start it
		startPomodoroTimer(config.pomodoroDuration);
	}
};

/**
 * Restarts the Pomodoro timer from the beginning.
 */
const restartPomodoroTimer = () => {
	stopPomodoroTimer(); // Ensure any existing timer is stopped
	startPomodoroTimer(config.pomodoroDuration); // Start a new Pomodoro session from the beginning
};

/**
 * Starts the Pomodoro timer.
 * Initializes the timer and updates the status bar. Handles completion and transitions to break.
 * 
 * @param duration - The duration of the Pomodoro session or break in seconds.
 */
const startPomodoroTimer = (duration: number) => {
	secondsRemaining = duration; // Set the remaining seconds to the provided duration
	updateStatusBar(secondsRemaining, false); // Update the status bar to show Pomodoro timer

	if (pomodoroCount % 4 === 0) {
		pomodoroCount = 0; // Reset the Pomodoro count if needed
	}

	pomodoroInterval = setInterval(() => {
		secondsRemaining--;
		updateStatusBar(secondsRemaining, false); // Update status bar every second

		if (secondsRemaining <= 0) {
			clearInterval(pomodoroInterval);
			pomodoroCount++;
			playBeep(); // Play beep sound to indicate Pomodoro end
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
	secondsRemaining = isLongBreak ? config.longBreakDuration : config.shortBreakDuration;
	updateStatusBar(secondsRemaining, true); // Update the status bar to show break timer

	playBeep(); // Play beep sound to indicate break start

	pomodoroInterval = setInterval(() => {
		secondsRemaining--;
		updateStatusBar(secondsRemaining, true); // Update status bar every second

		if (secondsRemaining <= 0) {
			clearInterval(pomodoroInterval);
			playBeep(); // Play beep sound to indicate break end
			showTimedInformationMessage('🟢 Break is over! Time to get back to work.', 2000); // Show notification for 2 seconds
			startPomodoroTimer(config.pomodoroDuration); // Restart the Pomodoro timer
		}
	}, 1000);

	if (isLongBreak) {
		pomodoroCount = 0; // Reset the Pomodoro count after a long break
	}
};

/**
 * Stops the Pomodoro timer.
 * Clears the active timer and updates the status bar to indicate that the Pomodoro has stopped.
 */
const stopPomodoroTimer = () => {
	if (pomodoroInterval) {
		clearInterval(pomodoroInterval); // Stop the timer
		pomodoroStatusBar.text = 'Pomodoro paused'; // Update status bar text
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
	pomodoroStatusBar.text = makeStatusBarText(minutes, seconds, isBreak); // Update status bar text
	const color = isBreak ? new vscode.ThemeColor('pomodoro.breakTextColor') : new vscode.ThemeColor('statusBar.foreground');
	pomodoroStatusBar.color = color; // Update status bar color
};

/**
 * Returns a readable string for the Pomodoro count.
 * 
 * @param custom - Whether to return a custom string for "Long" break. Defaults to true.
 * @returns A string representing the Pomodoro count or "Long" for long breaks.
 */
const readableNumber = (custom: boolean = true) => {
	switch (pomodoroCount) {
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
	`${isBreak ? '🔴' : '🟢'} ${isBreak ? `${readableNumber()} Break` : 'Work'} ${config.pomodoroClock ? `Time: ${m}:${s}` : 'Time'}`;

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
	`🔴 ${readableNumber(false)} Pomodoro completed! Time for a ${pomodoroCount % 4 !== 0 ? "short" : `${config.longBreakDuration / 60}min`} break.`;

/**
 * Plays a system beep sound.
 * Executes a platform-specific command to play a beep sound.
 */
const playBeep = () => {
	const platform = process.platform;
	const command = platform === 'win32' ? 'cmd /c echo \x07' : 'echo -e "\a"'; // Command for Windows and Unix
	exec(command);
};

// Activate the extension
export const activate = (context: vscode.ExtensionContext) => {
	console.log("Extension activated!");
	ctx = context;
	initialize();

	context.subscriptions.push(vscode.commands.registerCommand('pomodoro.toggle', handleClick)); // Register command for click handling
	context.subscriptions.push(vscode.commands.registerCommand('pomodoro.startPomodoro', startPomodoroTimer));
	context.subscriptions.push(vscode.commands.registerCommand('pomodoro.stopPomodoro', stopPomodoroTimer));
	context.subscriptions.push(pomodoroStatusBar);
	vscode.workspace.onDidChangeConfiguration(() => initialize(true)); // Reinitialize on configuration change

	startPomodoroTimer(config.pomodoroDuration); // Start Pomodoro timer initially
};

// Deactivate the extension
export const deactivate = () => {
	if (pomodoroInterval) {
		clearInterval(pomodoroInterval); // Clear timer on deactivation
	}
	console.log("Extension deactivated!");
};
