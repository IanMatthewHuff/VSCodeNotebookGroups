import * as vscode from 'vscode';

// Retrieve the cell run group value
export function getCellRunGroupValue(cell: vscode.NotebookCell): string {
    return cell.metadata.notebookRunGroups || '';
}

// Update cell metadata with the new run group value
export function updateCellRunGroupValue(cell: vscode.NotebookCell, newGroupValue: string) {
    const metadata = { ...(cell.metadata || {}), notebookRunGroups: newGroupValue };

    // Perform our actual replace and edit
    const wsEdit = new vscode.WorkspaceEdit();
    wsEdit.replaceNotebookCellMetadata(cell.document.uri, cell.index, metadata);
    vscode.workspace.applyEdit(wsEdit);
}