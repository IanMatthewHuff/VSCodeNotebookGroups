import * as vscode from 'vscode';
import { log } from './util/logging';
import { registerCommands } from './commands';
import { registerDocuments } from './documents';

export function startup(context: vscode.ExtensionContext) {
	// Register all of our commands
	registerCommands(context);

    // Register document handling
    registerDocuments(context);
}
