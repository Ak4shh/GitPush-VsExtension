import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const GIT_PUSH_RE = /^(?:&\s+)?(?:(?:"[^"]+"|'[^']+'|[^\s"']+[\\/])?git(?:\.exe)?)\s+push(?:\s|$)/i;

export function activate(context: vscode.ExtensionContext): void {
	const output = vscode.window.createOutputChannel('Git Push Success Sound');
	let showedExitCodeHint = false;

	output.appendLine('[git-push-sound] Extension activated.');

	const disposable = vscode.window.onDidEndTerminalShellExecution(async (event) => {
		const command = event.execution.commandLine.value.trim();

		if (!GIT_PUSH_RE.test(command)) {
			return;
		}

		output.appendLine(`[git-push-sound] Detected push command: "${command}"`);

		if (typeof event.exitCode !== 'number') {
			output.appendLine('[git-push-sound] exitCode is undefined. Skipping sound.');
			if (!showedExitCodeHint) {
				showedExitCodeHint = true;
				void vscode.window.showInformationMessage(
					'Git Push Success Sound: shell integration did not provide exit code, so sound was skipped.'
				);
			}
			return;
		}

		if (event.exitCode !== 0) {
			output.appendLine(`[git-push-sound] Push failed (exit ${event.exitCode}). Skipping sound.`);
			return;
		}

		const played = await playSuccessSound(context, output);
		if (played) {
			vscode.window.setStatusBarMessage('Git push succeeded', 2000);
			output.appendLine('[git-push-sound] Success sound played.');
		} else {
			output.appendLine('[git-push-sound] No available sound command succeeded.');
		}
	});

	context.subscriptions.push(disposable, output);
}

async function playSuccessSound(
	context: vscode.ExtensionContext,
	output: vscode.OutputChannel
): Promise<boolean> {
	const soundPath = path.join(context.extensionPath, 'wealth.mp3');
	if (!fs.existsSync(soundPath)) {
		output.appendLine(`[git-push-sound] Sound file missing: ${soundPath}`);
		return false;
	}

	switch (process.platform) {
		case 'win32':
			return playWindows(soundPath, output);
		case 'darwin':
			return runSoundCommand('afplay', [soundPath], output);
		case 'linux':
			if (await runSoundCommand('canberra-gtk-play', ['-f', soundPath], output)) {
				return true;
			}
			return runSoundCommand('paplay', [soundPath], output);
		default:
			output.appendLine(`[git-push-sound] Unsupported platform: ${process.platform}`);
			return false;
	}
}

async function playWindows(soundPath: string, output: vscode.OutputChannel): Promise<boolean> {
	// mciSendString (winmm.dll): plays MP3 synchronously, no message pump needed.
	const escaped = soundPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	const script = [
		`Add-Type -TypeDefinition @'`,
		`using System;`,
		`using System.Runtime.InteropServices;`,
		`using System.Text;`,
		`public class WinMM {`,
		`    [DllImport("winmm.dll", CharSet=CharSet.Auto)]`,
		`    public static extern int mciSendString(string cmd, StringBuilder ret, int retLen, IntPtr hwnd);`,
		`}`,
		`'@`,
		`[WinMM]::mciSendString('open "${escaped}" type mpegvideo alias snd', $null, 0, [IntPtr]::Zero)`,
		`[WinMM]::mciSendString('play snd wait', $null, 0, [IntPtr]::Zero)`,
		`[WinMM]::mciSendString('close snd', $null, 0, [IntPtr]::Zero)`,
	].join('\n');

	const ok = await runSoundCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], output);

	if (!ok) {
		output.appendLine('[git-push-sound] mciSendString failed — falling back to beep.');
		await runSoundCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', '[console]::Beep(1000, 300)'], output);
	}

	return ok;
}

function runSoundCommand(
	command: string,
	args: string[],
	output: vscode.OutputChannel
): Promise<boolean> {
	return new Promise((resolve) => {
		execFile(command, args, { windowsHide: true }, (error, _stdout, stderr) => {
			if (error) {
				output.appendLine(`[git-push-sound] Command failed: ${command} ${args.join(' ')}`);
				output.appendLine(`[git-push-sound] ${error.message}`);
				if (stderr) {
					output.appendLine(stderr.trim());
				}
				resolve(false);
				return;
			}
			resolve(true);
		});
	});
}

export function deactivate(): void {}
