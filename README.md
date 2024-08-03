# Pomodoro Extension

Developed by **[M B Parvez](https://www.mbparvez.me)**, support by **[Gosoft](https://www.gosoft.io)**.

Pomodoro is a Visual Studio Code extension that boosts productivity using the Pomodoro technique. It features a customizable clock in the status bar, helping you work in focused intervals with regular breaks. Enhance your coding sessions with Pomodoro.

## Description

Pomodoro helps you manage time by breaking work into 25-minute intervals with short breaks in between. After four intervals, you take a longer break. This method improves focus, prevents burnout, and boosts productivity.

### Features

- Customizable Pomodoro duration
- Customizable short and long break durations
- Pomodoro clock displayed on the status bar
- Notifications for Pomodoro completion and break times
- Dynamic status bar updates

## User Guide

### Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. Search for `Pomodoro`.
4. Click the `Install` button.

### Usage

**Starting the Pomodoro Timer**

The Pomodoro timer starts automatically when you open Visual Studio Code. The remaining time will be displayed on the status bar.

**Manually Starting the Pomodoro Timer**

1. Open the Command Palette by pressing `Ctrl+Shift+P` or `F1`.
2. Type `Start Pomodoro` and select it.
3. The Pomodoro timer will start, and the remaining time will be displayed on the status bar.

**Stopping the Pomodoro Timer**

1. Open the Command Palette by pressing `Ctrl+Shift+P` or `F1`.
2. Type `Stop Pomodoro` and select it.
3. The Pomodoro timer will stop, and the status bar will indicate that the timer has been stopped.

**Customizing Pomodoro Settings**
1. Open the Settings view by clicking on the gear icon in the Activity Bar and selecting `Settings` or by pressing `Ctrl+,`.
2. Search for `Pomodoro`.
3. Adjust the following settings according to your preference:
      - **`Pomodoro Duration`**: Set the duration of a Pomodoro interval (in minutes).
      - **`Short Break Duration`**: Set the duration of a short break (in minutes).
      - **`Long Break Duration`**: Set the duration of a long break (in minutes).
      - **`Pomodoro Clock`**: Enable or disable the Pomodoro clock display on the status bar.

### Configuration

You can customize the Pomodoro settings in your `settings.json` file:
```json
{
    "pomodoro.pomodoroDuration": 25,
    "pomodoro.shortBreakDuration": 5,
    "pomodoro.longBreakDuration": 20,
    "pomodoro.pomodoroClock": true
}
```

## Contributing
If you would like to contribute to Pomodoro, please follow these steps:

1. [Fork the repository](https://github.com/mbparvezme/pomodoro-vscode-extension).
2. Create a new branch.
3. Make your changes.
4. Commit your changes.
5. Push to the branch.
6. Create a pull request.


## License
This project is licensed under the MIT License. See the LICENSE file for details.


## Support
Show your support:
- [Github star](https://github.com/mbparvezme/pomodoro-vscode-extension)
- [Valuable feedback](https://www.mbparvez.me/r/pomodoro-vscode-extension)
- Extension rating
- Paypal



## For more information

* [M B Parvez](https://www.mbparvez.me)
* [Gosoft](https://www.gosoft.io)

**Enjoy!**
