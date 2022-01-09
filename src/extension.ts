import * as vscode from 'vscode';
import { addIgnore, triggerDecoration, IgnoreDetails } from './ignore';
import { TfsecIssueProvider } from './explorer/issues_treeview';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';
import { getInstalledTfsecVersion } from './utils';
import { TfsecHelpProvider } from './explorer/check_helpview';
import * as semver from 'semver';
import * as child from 'child_process';
import { TfSecCheck } from './tfsec_check';


// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('tfsec extension activated');
	const helpProvider = new TfsecHelpProvider();
	let activeEditor = vscode.window.activeTextEditor;
	const issueProvider = new TfsecIssueProvider(context);
	var outputChannel = vscode.window.createOutputChannel("tfsec");
	context.subscriptions.push(vscode.window.registerWebviewViewProvider("tfsec.helpview", helpProvider));

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

	context.subscriptions.push(vscode.commands.registerCommand('tfsec.refresh', () => issueProvider.refresh()));

	context.subscriptions.push(vscode.commands.registerCommand('tfsec.version', () => showCurrentTfsecVersion()));

	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignore', (element: TfsecTreeItem) => ignoreInstance(element)));

	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignoreAll', (element: TfsecTreeItem) => ignoreAllInstances(element, issueProvider)));

	context.subscriptions.push(vscode.commands.registerCommand("tfsec.run", () => runTfsec()));


	context.subscriptions.push(vscode.commands.registerCommand("tfsec.updatebinary", () => {
		const currentVersion = getInstalledTfsecVersion();

		if (semver.lt(currentVersion, "0.39.39")) {
			vscode.window.showInformationMessage(`Self updating was not introduced till v0.39.39 and you are running ${currentVersion}. Pleae update manually to at least v0.39.39`);
		}
		try {
			var binary = getBinaryPath();
			let result: Buffer = child.execSync(binary + " --update");
			outputChannel.show();
			outputChannel.append(result.toLocaleString());
		} catch (err) {

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

	showCurrentTfsecVersion();
}

function ignoreInstance(element: TfsecTreeItem) {
	const details = [new IgnoreDetails(element.code, element.startLineNumber, element.endLineNumber)];
	addIgnore(element.filename, details);
	const config = vscode.workspace.getConfiguration('tfsec');
	var reRunOnIgnore = config.get('runOnIgnore', true);
	if (reRunOnIgnore) {
		vscode.commands.executeCommand("tfsec.run");
	};
}

function ignoreAllInstances(element: TfsecTreeItem, issueProvider: TfsecIssueProvider) {
	let ignoreMap = new Map<string, IgnoreDetails[]>();

	for (let index = 0; index < issueProvider.resultData.length; index++) {
		const r = issueProvider.resultData[index];
		if (r === undefined) {
			continue;
		}
		if (r.code !== element.code) { continue; }

		let ignores = ignoreMap.get(r.filename);
		if (!ignores) {
			ignores = [];
		}
		ignores.push(new IgnoreDetails(r.code, r.startLine, r.endLine));
		ignoreMap.set(r.filename, ignores);
	}

	ignoreMap.forEach((ignores: IgnoreDetails[], filename: string) => {
		addIgnore(filename, ignores);
	});
	Promise.resolve();
	const config = vscode.workspace.getConfiguration('tfsec');
	var reRunOnIgnore = config.get('runOnIgnore', true);
	if (reRunOnIgnore) {
		vscode.commands.executeCommand("tfsec.run");
	};
}

function getBinaryPath() {
	const config = vscode.workspace.getConfiguration('tfsec');
	var binary = config.get('binaryPath', 'tfsec');
	if (binary === "") {
		binary = "tfsec";
	}
	return binary;
}

function showCurrentTfsecVersion() {
	const currentVersion = getInstalledTfsecVersion();
	if (currentVersion) {
		vscode.window.showInformationMessage(`Current tfsec version is ${currentVersion}`);
	}
}

function buildCommand(resultsStoragePath: string, scanPath: string) {
	const config = vscode.workspace.getConfiguration('tfsec');
	const binary = getBinaryPath();

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
	command.push(scanPath);

	return command.join(" ");
}

function runTfsec(issueProvider: TfsecIssueProvider, outputChannel: vscode.OutputChannel) {

	if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
		&& vscode.workspace.workspaceFolders[0] !== undefined) {

		let command = buildCommand(issueProvider.resultsStoragePath, vscode.workspace.workspaceFolders[0].uri.fsPath);
		try {
			let result: Buffer = child.execSync(command);
			outputChannel.show();
			outputChannel.append(result.toString());
		} catch (err) {

		} finally {
			setTimeout(() => { vscode.commands.executeCommand("tfsec.refresh"); }, 250);
		}
	}
}