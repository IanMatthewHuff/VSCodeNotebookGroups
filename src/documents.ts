import * as vscode from 'vscode';
import { log } from './util/logging';

export function registerDocuments(context: vscode.ExtensionContext) {
    // Scan all currently open notebook documents
    vscode.workspace.notebookDocuments.forEach((doc) => scanDocument(doc));

    // Sign up for any document opens that we get
    context.subscriptions.push(vscode.workspace.onDidOpenNotebookDocument(documentOpen));
}

function documentOpen(document: vscode.NotebookDocument) {
    scanDocument(document);
}

function scanDocument(document: vscode.NotebookDocument) {
    log(`Scanning document ${document.uri.toString()}`);
}