import * as vscode from 'vscode';
import { UpdateTfsecIgnoreDecorations } from './ignore_resolution';
import { TfsecIssueProvider } from './explorer/issues_treeview';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('tfsec extension activated');
	const issueProvider = new TfsecIssueProvider(context);
	vscode.window.registerTreeDataProvider("tfsec-issues", issueProvider);
	vscode.commands.registerCommand('tfsec.refresh', () => issueProvider.refresh());

	let timeout: NodeJS.Timer | undefined = undefined;
	let activeEditor = vscode.window.activeTextEditor;

	function triggerDecoration() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}

		timeout = setTimeout(UpdateTfsecIgnoreDecorations, 500);
	}

	vscode.commands.registerCommand('tfsec.ignore', (element: TfsecTreeItem) => {
		vscode.workspace.openTextDocument(vscode.Uri.file(element.filename)).then((file: vscode.TextDocument) => {
			vscode.window.showTextDocument(file, 1, false).then(e => {
				e.edit(edit => {
					edit.insert(new vscode.Position(element.lineNumber - 1, 0), `# tfsec:ignore:${element.code}\n`);
				});
			});
		});
	});

	if (activeEditor) {
		triggerDecoration();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerDecoration();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerDecoration();
		}
	}, null, context.subscriptions);

	vscode.commands.registerCommand('tfsec.runTfsec', () => {
		let terminal = vscode.window.createTerminal();
		terminal.show();
		if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
			terminal.sendText(`tfsec --force-all-dirs --exclude-downloaded-modules --format json --out "${issueProvider.resultsStoragePath}"`);
		}
	});

	
}