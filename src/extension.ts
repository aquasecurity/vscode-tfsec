import * as vscode from 'vscode';
import { ignoreAllInstances, ignoreInstance, triggerDecoration } from './ignore';
import { TfsecIssueProvider } from './explorer/issues_treeview';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';
import { TfsecHelpProvider } from './explorer/check_helpview';

import { extname } from 'path';
import { TfsecWrapper } from './tfsec_wrapper';


// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor;
	var outputChannel = vscode.window.createOutputChannel("tfsec");

	const helpProvider = new TfsecHelpProvider();
	const issueProvider = new TfsecIssueProvider(context);
	const tfsecWrapper = new TfsecWrapper(outputChannel, issueProvider.resultsStoragePath);

	// creating the issue tree explicitly to allow access to events
	let issueTree = vscode.window.createTreeView("tfsec.issueview", {
		treeDataProvider: issueProvider,
	});

	issueTree.onDidChangeSelection(function (event) {
		const treeItem = event.selection[0];
		if (treeItem) {
			helpProvider.update(treeItem);
		}
	});

	context.subscriptions.push(vscode.window.registerWebviewViewProvider("tfsec.helpview", helpProvider));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.refresh', () => issueProvider.refresh()));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.version', () => tfsecWrapper.showCurrentTfsecVersion()));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignore', (element: TfsecTreeItem) => ignoreInstance(element, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignoreAll', (element: TfsecTreeItem) => ignoreAllInstances(element, issueProvider, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignoreSeverity', (element: TfsecTreeItem) => ignoreAllInstances(element, issueProvider, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand("tfsec.run", () => tfsecWrapper.run()));
	context.subscriptions.push(vscode.commands.registerCommand("tfsec.updatebinary", () => tfsecWrapper.updateBinary()));

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		// only act if this is a terraform file
		if (editor && extname(editor.document.fileName) !== '.tf') {
			return;
		}
		activeEditor = editor;
		triggerDecoration();
	}, null, context.subscriptions));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		// only act if this is a terraform file
		if (extname(event.document.fileName) !== '.tf') {
			return;
		}
		if (activeEditor && event.document === activeEditor.document) {
			triggerDecoration();
		}
	}, null, context.subscriptions));

	if (activeEditor && extname(activeEditor.document.fileName) !== '.tf') {
		triggerDecoration();
	};
};
