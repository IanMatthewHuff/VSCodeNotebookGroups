// Code for working with the VS Code cell status bar to indicate group memberships
import * as vscode from 'vscode';
import { getCellRunGroupMetadata } from './cellMetadataHelpers';
import { RunGroup } from './enums';

// Create our class and register it to be cleaned up
export function registerCellStatusBarProvider(context: vscode.ExtensionContext) {
    const provider = new CellStatusBarItemProvider(context);
    context.subscriptions.push(provider);
}

// CellStatusBarItemProvider owns updating the cell status bar
// We need a class here to hold the event emitter since this doesn't get called automatically on metadata update
// due to a bug
export class CellStatusBarItemProvider implements vscode.NotebookCellStatusBarItemProvider {
    private static cellStatusChanged: vscode.EventEmitter<void>;
    // Class really just needed to hold the event emitter here
    constructor(context: vscode.ExtensionContext) {
        CellStatusBarItemProvider.cellStatusChanged = new vscode.EventEmitter<void>();
        this.onDidChangeCellStatusBarItems = CellStatusBarItemProvider.cellStatusChanged.event;
        context.subscriptions.push(vscode.notebooks.registerNotebookCellStatusBarItemProvider('*', this));
    }

    onDidChangeCellStatusBarItems?: vscode.Event<void> | undefined;

    // Called when we need to update status. Due to a bug this is currently not updating on metadata change, so we need the event
    // If it is fixed and called automatically on metadata update we can drop the class and event here for just a function
    provideCellStatusBarItems(cell: vscode.NotebookCell, token: vscode.CancellationToken): vscode.ProviderResult<vscode.NotebookCellStatusBarItem | vscode.NotebookCellStatusBarItem[]> {
        const cellRunGroups = getCellRunGroupMetadata(cell);
        const groupStrings = [];

        if (cellRunGroups.includes(RunGroup.one.toString())) {
            groupStrings.push('Group 1');
        }
        if (cellRunGroups.includes(RunGroup.two.toString())) {
            groupStrings.push('Group 2');
        }
        if (cellRunGroups.includes(RunGroup.three.toString())) {
            groupStrings.push('Group 3');
        }

        return { text: groupStrings.join(' '), alignment: vscode.NotebookCellStatusBarAlignment.Left }; 
    }

    public dispose() {
        CellStatusBarItemProvider.cellStatusChanged.dispose();
    }

    // Let the rest of the extension have a way to notify that cell status has changed
    public static cellStatusBarChanged() {
        CellStatusBarItemProvider.cellStatusChanged.fire();
    }
}

// UNCOMMENT IF THIS ISSUE IS FIXED
// https://github.com/microsoft/vscode/issues/139324
// In this case we don't need the event, so it's cleaner without classes and disposing

// // Register our provider
// export function registerCellStatusBarProvider(context: vscode.ExtensionContext) {
    // context.subscriptions.push(vscode.notebooks.registerNotebookCellStatusBarItemProvider('*', { provideCellStatusBarItems } ));
// }

// // Check the cell metadata and generate a string to show group membership
// function provideCellStatusBarItems(cell: vscode.NotebookCell, token: vscode.CancellationToken): vscode.ProviderResult<vscode.NotebookCellStatusBarItem> {
    // const cellRunGroups = getCellRunGroupMetadata(cell);
    // const groupStrings = [];

    // if (cellRunGroups.includes(RunGroup.one.toString())) {
        // groupStrings.push('Group 1');
    // }
    // if (cellRunGroups.includes(RunGroup.two.toString())) {
        // groupStrings.push('Group 2');
    // }
    // if (cellRunGroups.includes(RunGroup.three.toString())) {
        // groupStrings.push('Group 3');
    // }

    // return { text: groupStrings.join(' '), alignment: vscode.NotebookCellStatusBarAlignment.Left }; 
// }
