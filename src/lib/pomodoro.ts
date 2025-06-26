import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

// You must run 'npm install play-sound' for this to work.
const player = require('play-sound')({});

/**
 * Interface for the Pomodoro configuration settings.
 */
export interface Config {
	pomodoroDuration: number;
	shortBreakDuration: number;
	longBreakDuration: number;
	pomodoroClock: boolean;
	confirmOnRestart: boolean;
	autoPauseOnIdle: {
		enabled: boolean;
		timeout: number; // in minutes
	};
}

/**
 * Manages the entire state and logic of the Pomodoro timer.
 */
export class PomodoroManager implements vscode.Disposable {
	private config: Config;
	private statusBarItem: vscode.StatusBarItem;
	private extensionPath: string;

	// State variables
	private isPaused: boolean = false;
	private wasPausedByIdle: boolean = false; // NEW: Tracks if pause was automatic
	private isBreak: boolean = false;
	private pomodoroCount: number = 0;
	private timerInterval: NodeJS.Timeout | undefined;
	private secondsRemaining: number = 0;
	private idleTimeout: NodeJS.Timeout | undefined;

	// Click handling variables
	private clickTimeout: NodeJS.Timeout | undefined;
	private readonly clickDelay = 250; // ms

	constructor(statusBarItem: vscode.StatusBarItem, initialConfig: Config, extensionPath: string) {
		this.statusBarItem = statusBarItem;
		this.config = initialConfig;
		this.extensionPath = extensionPath;
		this.secondsRemaining = this.config.pomodoroDuration;
		this.updateStatusBar();
	}

	public start() {
		this.startPomodoro();
	}

	public handleClick() {
		if (this.clickTimeout) {
			clearTimeout(this.clickTimeout);
			this.clickTimeout = undefined;
			this.restartTimer();
		} else {
			this.clickTimeout = setTimeout(() => {
				this.clickTimeout = undefined;
				this.togglePause();
			}, this.clickDelay);
		}
	}

	public async restartTimer() {
		if (this.config.confirmOnRestart) {
			const choice = await vscode.window.showWarningMessage(
				'Are you sure you want to restart the current session?',
				{ modal: true },
				'Restart'
			);
			if (choice !== 'Restart') {
				return;
			}
		}

		this.stopTimer();
		if (this.isBreak) {
			this.startBreak(true);
		} else {
			this.startPomodoro(true);
		}
		vscode.window.showInformationMessage('Pomodoro timer restarted.');
	}

	/**
	 * Toggles the timer between paused and running states. This is for MANUAL user actions.
	 */
	public togglePause() {
		if (this.isPaused) {
			// --- Resume ---
			this.isPaused = false;
			this.wasPausedByIdle = false; // Always reset flag on any resume
			this.startTimer(this.secondsRemaining);
			if (!this.isBreak) {
				this.resetIdleTimer();
			}
		} else {
			// --- Manual Pause ---
			this.isPaused = true;
			this.wasPausedByIdle = false; // Explicitly set to false for manual pause
			this.stopTimer();
			this.updateStatusBar();
		}
	}

	/**
	 * Called by listeners when user activity is detected. Handles auto-resume and idle timer reset.
	 */
	public onDidReceiveActivity() {
		// --- Auto-Resume Logic ---
		if (this.isPaused && this.wasPausedByIdle) {
			this.togglePause(); // This will resume the timer
			vscode.window.showInformationMessage("Pomodoro timer resumed.");
			return; // Exit after resuming
		}

		// --- Idle Timer Reset Logic ---
		if (this.config.autoPauseOnIdle.enabled && this.timerInterval && !this.isBreak && !this.isPaused) {
			this.resetIdleTimer();
		}
	}

	private startPomodoro(isRestart: boolean = false) {
		if (!isRestart) {
			if (this.pomodoroCount % 4 === 0) {
				this.pomodoroCount = 0;
			}
			this.playSound('start');
		}
		this.isBreak = false;
		this.isPaused = false;
		this.wasPausedByIdle = false;
		this.startTimer(this.config.pomodoroDuration);
		this.resetIdleTimer();
	}

	private startBreak(isRestart: boolean = false) {
		this.isBreak = true;
		this.isPaused = false;
		this.wasPausedByIdle = false;

		const isLongBreak = this.pomodoroCount % 4 === 0;
		this.secondsRemaining = isLongBreak ? this.config.longBreakDuration : this.config.shortBreakDuration;

		if (!isRestart) {
			this.playSound('start');
		}

		this.startTimer(this.secondsRemaining);

		if (isLongBreak && !isRestart) {
			this.pomodoroCount = 0;
		}
	}
	
	private startTimer(duration: number) {
		this.secondsRemaining = duration;
		this.updateStatusBar();

		this.timerInterval = setInterval(() => {
			this.secondsRemaining--;
			this.updateStatusBar();

			if (this.secondsRemaining <= 0) {
				this.onTimerFinished();
			}
		}, 1000);
	}

	private stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = undefined;
		}
		this.clearIdleTimer();
	}

	private onTimerFinished() {
		this.stopTimer();
		this.playSound('end');

		if (this.isBreak) {
			this.showTimedInformationMessage('🟢 Break is over! Time to get back to work.', 3000);
			this.startPomodoro();
		} else {
			this.pomodoroCount++;
			this.showTimedInformationMessage(this.makePomodoroEndNotification(), 3000);
			this.startBreak();
		}
	}

	private updateStatusBar() {
		const minutes = Math.floor(this.secondsRemaining / 60).toString().padStart(2, '0');
		const seconds = (this.secondsRemaining % 60).toString().padStart(2, '0');

		let text: string;
		if (this.isPaused) {
			text = `⏸️ Paused ${minutes}:${seconds}`;
		} else {
			const icon = this.isBreak ? '🔴' : '🟢';
			const type = this.isBreak ? `${this.readableNumber()} Break` : 'Work';
			text = `${icon} ${type}`;
			if (this.config.pomodoroClock) {
				text += ` ${minutes}:${seconds}`;
			}
		}

		this.statusBarItem.text = text;
		this.statusBarItem.color = this.isBreak
			? new vscode.ThemeColor('pomodoro.breakTextColor')
			: new vscode.ThemeColor('statusBar.foreground');
	}

	public updateConfig(newConfig: Config) {
		const wasAutoPauseEnabled = this.config.autoPauseOnIdle.enabled;
		this.config = newConfig;

		if (this.config.autoPauseOnIdle.enabled && !wasAutoPauseEnabled) {
			this.resetIdleTimer();
		} else if (!this.config.autoPauseOnIdle.enabled && wasAutoPauseEnabled) {
			this.clearIdleTimer();
		}

		if (!this.timerInterval && !this.isPaused) {
			this.secondsRemaining = this.config.pomodoroDuration;
			this.updateStatusBar();
		}
		vscode.window.showInformationMessage('Pomodoro settings updated. Changes will apply to the next session.');
	}

	public dispose() {
		this.stopTimer();
		if (this.clickTimeout) {
			clearTimeout(this.clickTimeout);
		}
	}

	/**
	 * Pauses the timer automatically due to inactivity.
	 */
	private autoPause() {
		if (this.timerInterval && !this.isPaused && !this.isBreak) {
			this.isPaused = true;
			this.wasPausedByIdle = true; // Set the flag for auto-resume
			this.stopTimer();
			this.updateStatusBar();
			vscode.window.showInformationMessage("Pomodoro paused due to inactivity.");
		}
	}
	
	private resetIdleTimer() {
		if (!this.config.autoPauseOnIdle.enabled) return;
		this.clearIdleTimer();
		this.idleTimeout = setTimeout(() => {
			this.autoPause();
		}, this.config.autoPauseOnIdle.timeout * 60 * 1000);
	}

	private clearIdleTimer() {
		if (this.idleTimeout) {
			clearTimeout(this.idleTimeout);
			this.idleTimeout = undefined;
		}
	}
	
	private playSound(sound: 'start' | 'end') {
		const soundFile = sound === 'start' ? 'break-start-bip.mp3' : 'break-end-bip.mp3';
		const soundPath = path.join(this.extensionPath, 'sounds', soundFile);

		player.play(soundPath, (err: any) => {
			if (err) {
				console.error(`Pomodoro Error: Could not play sound at ${soundPath}.`, err);
				const command = process.platform === 'win32' ? 'cmd /c echo \x07' : 'echo -e "\a"';
				exec(command);
			}
		});
	}
	
	private readableNumber(forNotification: boolean = false): string {
		if (this.pomodoroCount % 4 === 0) {
			return forNotification ? '4th' : 'Long';
		}
		const suffixes = ['st', 'nd', 'rd'];
		const count = this.pomodoroCount % 4;
		return `${count}${suffixes[count - 1] || 'th'}`;
	}

	private makePomodoroEndNotification(): string {
		const isLongBreak = (this.pomodoroCount % 4 === 0);
		const breakType = isLongBreak ? `${this.config.longBreakDuration / 60} minute long` : "short";
		return `🔴 ${this.readableNumber(true)} Pomodoro completed! Time for a ${breakType} break.`;
	}

	private showTimedInformationMessage(message: string, duration: number) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: message,
			cancellable: false
		}, (progress) => {
			return new Promise<void>(resolve => {
				setTimeout(() => {
					resolve();
				}, duration);
			});
		});
	}
}
