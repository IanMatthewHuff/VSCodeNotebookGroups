import * as vscode from 'vscode';
import { updateContextKeys } from './contextTracker';
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

    // Register remove commands
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.removeGroup1', (args) => {
        removeFromGroup(RunGroup.one, argNotebookCell(args));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.removeGroup2', (args) => {
        removeFromGroup(RunGroup.two, argNotebookCell(args));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.removeGroup3', (args) => {
        removeFromGroup(RunGroup.three, argNotebookCell(args));
    }));

    // Register execute commands
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.executeGroup1', (args) => {
        executeGroup(RunGroup.one, argNotebookCell(args));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.executeGroup2', (args) => {
        executeGroup(RunGroup.two, argNotebookCell(args));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-groups.executeGroup3', (args) => {
        executeGroup(RunGroup.three, argNotebookCell(args));
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

function executeGroup(targetRunGroup: RunGroup, notebookCell?: vscode.NotebookCell) {
    let doc = notebookCell?.notebook;

    // If we didn't get a cell passed in, just take the active documents
    if (!doc) {
        doc = vscode.window.activeNotebookEditor?.document;
        doc || log('Execute group called without a valid document to execute');
    }

    // Collect our cell indexes
    const targetCells = doc?.getCells().filter(notebookCell => cellInGroup(notebookCell, targetRunGroup)).map(cell => {
        return { start: cell.index, end: cell.index + 1 };
    });

    // Execute the cells
    vscode.commands.executeCommand('notebook.cell.execute', { ranges: targetCells } );
}

// Determine if a cell is in a given run group
function cellInGroup(cell: vscode.NotebookCell, targetRunGroup: RunGroup) {
    // Get cell metadata custom to our extension
    const customMetadata = cell.metadata.custom?.notebookRunGroups || {};
    let currentValue = customMetadata['groups'] as string || '';

    if (currentValue.includes(targetRunGroup.toString())) {
        return true;
    }

    return false;
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

    // Always update the context keys after add / remove
    updateContextKeys();
}

// Remove the given cell from the specified run group
function removeFromGroup(targetRunGroup: RunGroup, notebookCell?: vscode.NotebookCell) {
    // If we were not passed in a cell, look for one
    if (!notebookCell) {
        notebookCell = getCurrentActiveCell();
        if (!notebookCell) {
            return;
        }
    }

    removeGroupFromCustomMetadata(notebookCell, targetRunGroup);

    // Always update the context keys after add / remove
    updateContextKeys();
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

function removeGroupFromCustomMetadata(notebookCell: vscode.NotebookCell, targetRunGroup: RunGroup) {
    // TODO: Can use .with on the metadata
    const targetString = targetRunGroup.toString();

    // Get cell metadata custom to our extension
    const customMetadata = notebookCell.metadata.custom?.notebookRunGroups || {};
    let currentValue = customMetadata['groups'] as string || '';

    if (!currentValue.includes(targetString)) {
        // Not there, can't remove
        log('Given run group is not present, so cannot be removed from.');
        return;
    }

    // Add in our group value
    currentValue = currentValue.replace(targetString, '');
    customMetadata['groups'] = currentValue;
    log(`Removing from group Cell Index: ${notebookCell.index} Groups Value: ${targetRunGroup.toString()}`);

    // Apply the new metadata to the cell
    editCellMetadata(notebookCell, customMetadata);
}

function addGroupToCustomMetadata(notebookCell: vscode.NotebookCell, targetRunGroup: RunGroup) {
    // TODO: Can use .with on the metadata
    const targetString = targetRunGroup.toString();

    // Get cell metadata custom to our extension
    const customMetadata = notebookCell.metadata.custom?.notebookRunGroups || {};
    let currentValue = customMetadata['groups'] as string || '';

    if (currentValue.includes(targetString)) {
        // Already there, return
        log('Attempted to add cell to a group it is already in');
        return;
    }

    // Add in our group value
    currentValue = currentValue.concat(targetString);
    customMetadata['groups'] = currentValue;
    log(`Adding to group Cell Index: ${notebookCell.index} Groups Value: ${currentValue}`);

    // Apply the new metadata to the cell
    editCellMetadata(notebookCell, customMetadata);
}

// Apply new metadata to a notebook cell
function editCellMetadata(notebookCell: vscode.NotebookCell, runGroupMetadata: { [key: string]: any }) {
    const wsEdit = new vscode.WorkspaceEdit();

    // Update our metadata.custom.notebookRunGroups block
    const newMetadata = notebookCell.metadata;

    if (!newMetadata.custom) {
        newMetadata.custom = {};
    }
    newMetadata.custom['notebookRunGroups'] = runGroupMetadata;
    

    // Perform our actual replace and edit
    wsEdit.replaceNotebookCellMetadata(notebookCell.document.uri, notebookCell.index, newMetadata);
    vscode.workspace.applyEdit(wsEdit);
}
