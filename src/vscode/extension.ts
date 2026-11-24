import * as vscode from 'vscode';
import path from 'path';
import { NgAnalyzer } from '../analyzer/ng-analyzer.js';
import { NgLensServer } from '../server/index.js';

let currentPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('nglens.openVisualizer', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('NgLens: Please open an Angular workspace folder first.');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Two);
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      'nglensVisualizer',
      '🅰️ NgLens: Visual Component & Signals Graph',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)]
      }
    );

    const runAnalysis = () => {
      try {
        const analyzer = new NgAnalyzer({ projectRoot: rootPath });
        return analyzer.analyze();
      } catch (err: any) {
        vscode.window.showErrorMessage(`NgLens Analysis Failed: ${err.message}`);
        return null;
      }
    };

    const initialData = runAnalysis();
    if (!initialData) return;

    // Load webview HTML with injected data
    currentPanel.webview.html = NgLensServer.getHtmlWithData(initialData);

    // Handle messages sent from Webview
    currentPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'openFile': {
            if (message.filePath) {
              try {
                const doc = await vscode.workspace.openTextDocument(message.filePath);
                const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
                if (message.line) {
                  const line = Math.max(0, message.line - 1);
                  const pos = new vscode.Position(line, 0);
                  editor.selection = new vscode.Selection(pos, pos);
                  editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
                }
              } catch (err: any) {
                vscode.window.showErrorMessage(`Could not open file: ${err.message}`);
              }
            }
            break;
          }
        }
      },
      undefined,
      context.subscriptions
    );

    // Watch for file changes in the Angular project to auto-refresh graph
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,html}');
    const debounceTimer: NodeJS.Timeout | null = null;

    const onFileChange = () => {
      if (currentPanel) {
        const updatedData = runAnalysis();
        if (updatedData) {
          currentPanel.webview.postMessage({
            command: 'updateData',
            data: updatedData
          });
        }
      }
    };

    watcher.onDidChange(onFileChange);
    watcher.onDidCreate(onFileChange);
    watcher.onDidDelete(onFileChange);

    currentPanel.onDidDispose(
      () => {
        currentPanel = undefined;
        watcher.dispose();
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  if (currentPanel) {
    currentPanel.dispose();
  }
}
