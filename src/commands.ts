import * as vscode from 'vscode';
import { RunGroup } from './enums';
import { log } from './util/logging';

// Register our commands for run groups
export function registerCommands(context: vscode.ExtensionContext) {
    // Register add commands
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.addGroup1', (args) => {
        addToGroup(RunGroup.one, argNotebookCell(args));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.addGroup2', (args) => {
        addToGroup(RunGroup.two, argNotebookCell(args));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.addGroup3', (args) => {
        addToGroup(RunGroup.three, argNotebookCell(args));
    }));
}

// Is the given argument a vscode NotebookCell?
function argNotebookCell(args: any): vscode.NotebookCell | undefined {
    // TODO: Is there a better way to do this? Seems ugly...
    if ('executionSummary' in args && 'metadata' in args) {
        return args as vscode.NotebookCell;
    }


    log('Non-NotebookCell passed to cell based notebook group function');
    return undefined;
}

// For the target cell, add it to the given run group
function addToGroup(targetRunGroup: RunGroup, notebookCell?: vscode.NotebookCell) {
    // If we were not passed in a cell, look for one
    if (!notebookCell) {
        notebookCell = getCurrentActiveCell();
        if (!notebookCell) {
            return;
        }
    }

    addGroupToCustomMetadata(notebookCell, targetRunGroup);
}

// Find the current active notebook document and the current active cell in it
function getCurrentActiveCell(): vscode.NotebookCell | undefined {
    const activeNotebook = vscode.window.activeNotebookEditor;

    if (activeNotebook) {
        // || is ok here as 0 index is the same as the default value
        const selectedCellIndex = activeNotebook?.selections[0]?.start || 0;

        return activeNotebook.document.cellCount >= 1 ? activeNotebook.document.cellAt(selectedCellIndex) : undefined;
    }

    return undefined;
}

// Get the cell metadata block for our extension specific data, create it if it's not there
function getOrAddCustomMetadata(notebookCell: vscode.NotebookCell): { [key: string]: any} {
    if (!notebookCell.metadata.custom) {
        notebookCell.metadata.custom = {};
    }
    if (!notebookCell.metadata.custom.notebookRunGroups) {
        notebookCell.metadata.custom.notebookRunGroups = {};
    }

    return notebookCell.metadata.custom.notebookRunGroups;
}

function addGroupToCustomMetadata(notebookCell: vscode.NotebookCell, targetRunGroup: RunGroup) {
    const targetString = targetRunGroup.toString();

    // Get cell metadata custom to our extension
    const customMetadata = getOrAddCustomMetadata(notebookCell);

    let currentValue = customMetadata['groups'] as string;

    if (currentValue.includes(targetString)) {
        // Already there, return
        return;
    }

    currentValue = currentValue.concat(targetString);
    customMetadata['groups'] = currentValue;

    // Apply the new metadata to the cell
    editCellMetadata(notebookCell, customMetadata);
}

// Apply new metadata to a notebook cell
function editCellMetadata(notebookCell: vscode.NotebookCell, newMetadata: { [key: string]: any }) {
    const wsEdit = new vscode.WorkspaceEdit();

    wsEdit.replaceNotebookCellMetadata(notebookCell.document.uri, notebookCell.index, newMetadata);

    vscode.workspace.applyEdit(wsEdit);
}
