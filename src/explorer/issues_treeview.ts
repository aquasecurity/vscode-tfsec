import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { sortByCode, sortBySeverity, uniqueLocations } from '../utils';
import { CheckResult, CheckSeverity } from './check_result';
import { TfsecTreeItem, TfsecTreeItemType } from './tfsec_treeitem';

export class TfsecIssueProvider implements vscode.TreeDataProvider<TfsecTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TfsecTreeItem | undefined | void> = new vscode.EventEmitter<TfsecTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TfsecTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	public resultData: CheckResult[] = [];
	private taintResults: boolean = true;
	private rootpath: string = "";
	private storagePath: string = "";
	public readonly resultsStoragePath: string = "";

	constructor(context: vscode.ExtensionContext) {
		if (context.storageUri) {
			this.storagePath = context.storageUri.fsPath;
			console.log(`storage path is ${this.storagePath}`);
			if (!fs.existsSync(this.storagePath)) {
				fs.mkdirSync(context.storageUri.fsPath);
			}
			this.resultsStoragePath = path.join(context.storageUri.fsPath, ".tfsec_results.json");
			if (!fs.existsSync(this.resultsStoragePath)) {
				fs.closeSync(fs.openSync(this.resultsStoragePath, 'w'));
			}
			// create the file watcher to refresh the tree when changes are made
			fs.watch(this.resultsStoragePath, (eventType) => {
				if (eventType !== "change") {
					return;
				}
				vscode.window.showInformationMessage("tfsec run complete, results file updated");
				// short wait for the file to be written before refreshing the tree
				setTimeout(() => { vscode.commands.executeCommand("tfsec.refresh"); }, 250);
			});
		}
	}

	refresh(): void {
		this.taintResults = true;
		this._onDidChangeTreeData.fire();
	}

	// when there is a tfsec output file, load the results
	loadResultData() {
		if (this.resultsStoragePath !== "" && vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]) {
			this.rootpath = vscode.workspace.workspaceFolders[0].uri.fsPath;
			if (fs.existsSync(this.resultsStoragePath)) {
				let content = fs.readFileSync(this.resultsStoragePath, 'utf8');
				try {
					const data = JSON.parse(content);
					this.resultData = [];
					if (data === null || data.results === null) {
						return;
					}
					for (let i = 0; i < data.results.length; i++) {
						const element = data.results[i];
						this.resultData.push(new CheckResult(element));
					}
					this.taintResults = !this.taintResults;
				}
				catch {
					console.debug(`Error loading results file ${this.resultsStoragePath}`)
				}
			}
		} else {
			vscode.window.showInformationMessage("No workspace detected to load tfsec results from");
		}
	}

	getTreeItem(element: TfsecTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TfsecTreeItem): Thenable<TfsecTreeItem[]> {
		// if this is refresh then get the top level codes
		let items: TfsecTreeItem[] = [];
		if (!element) {
			items = this.getCurrentTfsecSeverities();
		} else if (element.treeItemType === TfsecTreeItemType.issueSeverity) {
			items = this.getCurrentTfsecIssues(element.severity);
		} else {
			items = this.getIssuesLocationsByCode(element.code);
		}
		return Promise.resolve(items);
	}

	private getCurrentTfsecSeverities(): TfsecTreeItem[] {
		var results: TfsecTreeItem[] = [];
		var resolvedSeverities: string[] = [];


		if (this.taintResults) {
			this.loadResultData();
		}

		for (let index = 0; index < this.resultData.length; index++) {
			const result = this.resultData[index];
			if (result === undefined) {
				continue;
			}

			if (resolvedSeverities.includes(result.severity)) {
				continue;
			}
			resolvedSeverities.push(result.severity);
			results.push(new TfsecTreeItem(result.severity, new CheckSeverity(result), vscode.TreeItemCollapsibleState.Collapsed));
		}
		return results.sort(sortBySeverity);
	}


	private getCurrentTfsecIssues(severity: string): TfsecTreeItem[] {
		var results: TfsecTreeItem[] = [];
		var resolvedCodes: string[] = [];


		if (this.taintResults) {
			this.loadResultData();
		}

		for (let index = 0; index < this.resultData.length; index++) {
			const result = this.resultData[index];

			if (result === undefined) {
				continue;
			}
			if (resolvedCodes.includes(result.code) || result.severity !== severity) {
				continue;
			}
			resolvedCodes.push(result.code);
			results.push(new TfsecTreeItem(result.code, result, vscode.TreeItemCollapsibleState.Collapsed));
		}
		return results.sort(sortByCode);
	}

	getIssuesLocationsByCode(code: string): TfsecTreeItem[] {
		var results: TfsecTreeItem[] = [];

		const filtered = this.resultData.filter(c => c.code === code);
		for (let index = 0; index < filtered.length; index++) {
			const result = filtered[index];

			if (result === undefined) {
				continue;
			}
			if (result.code !== code) {
				continue;
			}
			let filename = trimPrefix(result.filename.replace(this.rootpath, ""), path.sep);
			const cmd = this.createFileOpenCommand(result);
			var item = new TfsecTreeItem(`${filename}:${result.startLine}`, result, vscode.TreeItemCollapsibleState.None, cmd);
			results.push(item);
		}
		return uniqueLocations(results);
	}

	private createFileOpenCommand(result: CheckResult) {
		const issueRange = new vscode.Range(new vscode.Position(result.startLine - 1, 0), new vscode.Position(result.endLine, 0));
		return {
			command: "vscode.open",
			title: "",
			arguments: [
				vscode.Uri.file(result.filename),
				{
					selection: issueRange,
				}
			]
		};
	}
}

function trimPrefix(input: string, prefix: string): string {
	var result = input;
	if (input.indexOf(prefix) === 0) {
		result = input.substr(prefix.length);
	}
	return result;
}

