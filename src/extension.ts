import * as vscode from 'vscode';
import { addIgnore, triggerDecoration, IgnoreDetails, FileIgnores } from './ignore';
import { TfsecIssueProvider } from './explorer/issues_treeview';
import { TfsecTreeItem, TfsecTreeItemType } from './explorer/tfsec_treeitem';
import { getInstalledTfsecVersion, getBinaryPath } from './utils';
import { TfsecHelpProvider } from './explorer/check_helpview';
import * as semver from 'semver';
import * as child from 'child_process';


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
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignore', (element: TfsecTreeItem) => ignoreInstance(element, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignoreAll', (element: TfsecTreeItem) => ignoreAllInstances(element, issueProvider, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignoreSeverity', (element: TfsecTreeItem) => ignoreAllInstances(element, issueProvider, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand("tfsec.run", () => runTfsec(issueProvider, outputChannel)));
	context.subscriptions.push(vscode.commands.registerCommand("tfsec.updatebinary", () => updateBinary(outputChannel)));

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

function ignoreInstance(element: TfsecTreeItem, outputChannel: vscode.OutputChannel) {
	const details = [new IgnoreDetails(element.code, element.startLineNumber, element.endLineNumber)];
	addIgnore(element.filename, details, outputChannel);

	rerunIfRequired();
}

function rerunIfRequired() {
	const config = vscode.workspace.getConfiguration('tfsec');
	var reRunOnIgnore = config.get('runOnIgnore', true);
	if (reRunOnIgnore) {
		setTimeout(() => { vscode.commands.executeCommand("tfsec.run"); }, 1000);
	} else {
		vscode.window.showInformationMessage("You should refresh the treeview after ignoring");
	};
}

async function ignoreAllInstances(element: TfsecTreeItem, issueProvider: TfsecIssueProvider, outputChannel: vscode.OutputChannel) {
	outputChannel.show();
	outputChannel.appendLine("\nSetting ignores - ");

	var seenIgnores: string[] = [];
	var ignoreMap = new Map<string, IgnoreDetails[]>();

	let severityIgnore = element.treeItemType === TfsecTreeItemType.issueSeverity;
	for (let index = 0; index < issueProvider.resultData.length; index++) {
		var r = issueProvider.resultData[index];
		if (r === undefined) {
			continue;
		}
		let ignores = ignoreMap.get(r.filename);
		if (!ignores) {
			ignores = [];
		}

		if (severityIgnore && r.severity !== element.severity) { continue; }
		if (!severityIgnore && r.code !== element.code) { continue; }

		let ingoreKey = `${r.filename}:${r.code}:${r.startLine}:${r.endLine}`;
		if (seenIgnores.includes(ingoreKey)) {
			continue;
		}
		seenIgnores.push(ingoreKey);
		ignores.push(new IgnoreDetails(r.code, r.startLine, r.endLine));
		ignoreMap.set(r.filename, ignores);
	}

	var edits: FileIgnores[] = [];
	ignoreMap.forEach((ignores: IgnoreDetails[], filename: string) => {
		edits.push(new FileIgnores(filename, ignores));
	});

	await edits.reduce(
		(p, x) =>
			p.then(_ => addIgnore(x.filename, x.ignores, outputChannel)),
		Promise.resolve()
	).then(() => {
		outputChannel.appendLine("Checking if re-run is enabled....");
		rerunIfRequired();
	});
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
	outputChannel.show();
	outputChannel.appendLine("");
	outputChannel.appendLine("Running tfsec to update results");

	if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
		&& vscode.workspace.workspaceFolders[0] !== undefined) {

		let command = buildCommand(issueProvider.resultsStoragePath, vscode.workspace.workspaceFolders[0].uri.fsPath);
		try {
			let result: Buffer = child.execSync(command);

			outputChannel.appendLine(result.toString());
		} catch (err) {
		} finally {
			setTimeout(() => { vscode.commands.executeCommand("tfsec.refresh"); }, 250);
		}
	}
}

function updateBinary(outputChannel: vscode.OutputChannel) {
	outputChannel.show();
	outputChannel.appendLine("");
	outputChannel.appendLine("Checking the current version");
	const currentVersion = getInstalledTfsecVersion();


	if (currentVersion.includes("running a locally built version")) {
		outputChannel.appendLine("You are using a locally built version which cannot be updated");
	}

	if (semver.lt(currentVersion, "0.39.39")) {
		vscode.window.showInformationMessage(`Self updating was not introduced till v0.39.39 and you are running ${currentVersion}. Pleae update manually to at least v0.39.39`);
	}
	outputChannel.appendLine("Attempting to download the latest version");
	var binary = getBinaryPath();
	try {
		let result: Buffer = child.execSync(binary + " --update --verbose");
		outputChannel.appendLine(result.toLocaleString());
	} catch (err) {
		vscode.window.showErrorMessage("There was a problem with the update, check the output window");
		let errMsg = err as Error;
		outputChannel.appendLine(errMsg.message);
	}
}