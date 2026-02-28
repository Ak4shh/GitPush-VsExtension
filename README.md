# Git Push Success Sound

Plays a sound every time a `git push` succeeds in the VS Code integrated terminal. The sound effect is the *Assassin's Creed Valhalla* "Wealth Collected" cue.

---

## Download & Install

1. Go to the **Releases** page on GitHub
2. Download the latest `.vsix` file
3. Open VS Code
4. Press `Ctrl+Shift+P` → type **Install from VSIX** → select the downloaded file

That's it. No configuration needed.

---

## How It Works

- Listens for terminal commands in the VS Code integrated terminal
- When you run `git push` and it succeeds, it plays a sound
- If the push fails, no sound plays
- A brief "Git push succeeded" message appears in the status bar

---

## Requirements

- VS Code 1.97 or newer
- Terminal shell integration must be enabled (it's on by default)
- **Windows:** PowerShell (built-in) — falls back to a beep if audio fails
- **macOS:** `afplay` (built-in)
- **Linux:** `paplay` or `canberra-gtk-play`

---

## Troubleshooting

If no sound plays after a successful push:

1. Open **View → Output** and select **Git Push Success Sound**
2. Run `git push` in the integrated terminal
3. Check the logs — common causes:
   - `exitCode is undefined` → shell integration is disabled
   - `Command failed` → missing audio backend (Linux)

To enable shell integration, make sure this is not disabled in your VS Code settings (`terminal.integrated.shellIntegration.enabled`).
