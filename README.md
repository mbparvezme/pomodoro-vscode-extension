# Pomodoro for Dev

**A Visual Studio Code extension to boost your productivity using the Pomodoro Technique. It features a highly configurable timer in the status bar, helping you work in focused intervals with regular breaks.**

---

## Description

The Pomodoro Technique is a time management method that uses a timer to break down work into focused intervals, traditionally 25 minutes in length, separated by short breaks. This extension integrates this technique seamlessly into your VS Code workflow to improve focus, prevent burnout, and boost productivity.

The timer runs directly in your status bar, giving you an at-a-glance view of your current session without leaving your editor.

## Features

* **Customizable Timers**: Set custom durations for your work sessions (Pomodoros), short breaks, and long breaks.
* **Dynamic Status Bar**: An elegant status bar item that shows the current session type (Work/Break), remaining time, and status icons.
* **Interactive Controls**:
    * **Single-click** the status bar item to manually pause or resume the timer.
    * **Double-click** the status bar item to restart the current session.
* **Confirmation on Restart**: An optional confirmation dialog to prevent accidental session restarts.
* **Auto-Pause on Idle**: The timer can automatically pause itself if you're inactive in VS Code for a configured amount of time.
* **Auto-Resume on Focus**: After being auto-paused, the timer will automatically resume as soon as you return to VS Code.
* **Audio Notifications**: Sound cues signal the start and end of each work or break session.
* **Command Palette Integration**: Control the timer using VS Code commands.

## User Guide

### Installation

1.  Open **Visual Studio Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X`).
3.  Search for `Pomodoro for Dev`.
4.  Click the **Install** button.
5.  Restart VS Code to activate the extension.

### Usage

* **Starting the Timer**: The Pomodoro timer starts automatically when you open VS Code. The remaining time will be displayed on the status bar.
* **Pausing/Resuming**: Single-click the Pomodoro status bar item to toggle between pause and resume.
* **Restarting a Session**: Double-click the status bar item to restart the current work or break timer from the beginning.

## Configuration

You can customize all features of the extension to fit your workflow.

1.  Open **Settings** in VS Code (`Ctrl+,`).
2.  Search for `Pomodoro`.
3.  Adjust the settings in the UI, or add them to your `settings.json` file.

### Example `settings.json`

```json
{
    // The duration of a Pomodoro work interval in minutes.
    "pomodoro.pomodoroDuration": 25,

    // The duration of a short break in minutes.
    "pomodoro.shortBreakDuration": 5,

    // The duration of a long break in minutes (after 4 Pomodoros).
    "pomodoro.longBreakDuration": 20,

    // Show the countdown clock in the status bar.
    "pomodoro.pomodoroClock": true,

    // Show a confirmation dialog before restarting a session with a double-click.
    "pomodoro.confirmOnRestart": true,

    // --- Auto-Pause on Idle Settings ---

    // Enable to automatically pause the timer after a period of inactivity.
    // The timer resumes automatically when you become active again.
    "pomodoro.autoPauseOnIdle.enabled": false,

    // The time in minutes of inactivity before the timer is auto-paused.
    "pomodoro.autoPauseOnIdle.timeout": 2
}
```

## Available Commands

You can access these commands via the Command Palette (`Ctrl+Shift+P`):

1.  `Pomodoro: Pause/Resume Timer`: Toggles the timer between paused and running states.
2.  `Pomodoro: Restart Current Session`: Restarts the current work or break session.

## Contributing

If you would like to contribute to Pomodoro, please follow these steps:

1. [Fork the repository](https://github.com/mbparvezme/pomodoro-vscode-extension).
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Commit your changes with a clear message.
5. Push to the branch.
6. Create a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Support

Show your support for the project:
- [Star the repository on GitHub](https://github.com/mbparvezme/pomodoro-vscode-extension)
- [Provide valuable feedback](https://www.mbparvez.me/r/pomodoro-vscode-extension)
- Rate the extension in the VS Code Marketplace

## For more information

* [M B Parvez](https://www.mbparvez.me)
* [Gosoft](https://www.gosoft.io)

**Enjoy!**
