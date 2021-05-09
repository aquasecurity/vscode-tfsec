import * as vscode from 'vscode';
import { triggerDecoration} from './ignore_resolver';
import { TfsecIssueProvider } from './explorer/issues_treeview';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';
import { getOrCreateTfsecTerminal } from './utils';
import { TfsecHelpProvider } from './explorer/check_helpview';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('tfsec extension activated');
	const helpProvider = new TfsecHelpProvider();
	let activeEditor = vscode.window.activeTextEditor;
	const issueProvider = new TfsecIssueProvider(context, helpProvider);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider("tfsec.helpview", helpProvider));

	// creating the issue tree explicitly to allow access to events
	let issueTree = vscode.window.createTreeView("tfsec.issueview", {
		treeDataProvider: issueProvider,
	});
	
	issueTree.onDidChangeSelection(function(event) {
		helpProvider.update(event.selection[0]);
	});

	context.subscriptions.push(vscode.commands.registerCommand('tfsec.refresh', () => issueProvider.refresh()));

	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignore', (element: TfsecTreeItem) => {
		vscode.workspace.openTextDocument(vscode.Uri.file(element.filename)).then((file: vscode.TextDocument) => {
			vscode.window.showTextDocument(file, 1, false).then(e => {
				e.edit(edit => {
					if (element.startLineNumber === element.endLineNumber) {
						let errorLine = vscode.window.activeTextEditor?.document.lineAt(element.startLineNumber);
						if (errorLine !== null && errorLine !== undefined) {
						edit.insert(new vscode.Position(errorLine.lineNumber-1, errorLine.firstNonWhitespaceCharacterIndex), `#tfsec:ignore:${element.code}\n`);
						}
					} else {
						edit.insert(new vscode.Position(element.startLineNumber - 1, 0), `#tfsec:ignore:${element.code}\n`);
					}
				});
			});
		});
		const config = vscode.workspace.getConfiguration('tfsec');
		var reRunOnIgnore = config.get('runOnIgnore', true);
		if (reRunOnIgnore) {
			vscode.commands.executeCommand("tfsec.run");
		};
	}));

	context.subscriptions.push(vscode.commands.registerCommand("tfsec.run", () => {
		let terminal = getOrCreateTfsecTerminal();
		terminal.show();
		if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
			terminal.sendText(buildCommand(issueProvider.resultsStoragePath));
		}
	}));

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerDecoration();
		}
	}, null, context.subscriptions));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerDecoration();
		}
	}, null, context.subscriptions));

	if (activeEditor) {
		triggerDecoration();
	}
}

function buildCommand(resultsStoragePath: string) {
	const config = vscode.workspace.getConfiguration('tfsec');
	var binary = config.get('binaryPath', 'tfsec');
	if (binary === "") {
		binary = "tfsec";
	}

	var command = [];
	command.push(binary);
	if (config.get<boolean>('fullDepthSearch')) {
		command.push('--force-all-dirs');
	}
	if (config.get<boolean>('ignoreDownloadedModules')) {
		command.push('--exclude-downloaded-modules');
	}

	command.push('--format json');
	command.push(`--out "${resultsStoragePath}"`);

	return command.join(" ");
}