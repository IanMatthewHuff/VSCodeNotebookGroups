import * as vscode from 'vscode';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-notebook-groups extension activated');

	// Register all of our commands
	registerCommands(context);
}

export function deactivate() {}
