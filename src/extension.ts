import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const themeFilePath = path.join(context.extensionPath, 'themes', 'meowrch-theme.json');

    const watcher = fs.watch(themeFilePath, (eventType, filename) => {
        if (eventType === 'change') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
            console.log('Meowrch theme changed');
        }
    });
    
    context.subscriptions.push({
        dispose: () => {
            watcher.close();
            console.log('File watcher closed.');
        }
    });
}

export function deactivate() {}
