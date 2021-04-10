import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { sortByCode, uniqueLocations } from '../utils';
import { ResultData } from './result_data';
import { TfsecTreeItem } from './tfsec_treeitem';

export class TfsecIssueProvider implements vscode.TreeDataProvider<TfsecTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TfsecTreeItem | undefined | void> = new vscode.EventEmitter<TfsecTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TfsecTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	private resultData: ResultData[] = [];
	private taintResults: boolean = true;
	private rootpath: string = "";
	public readonly resultsStoragePath: string = "";

	constructor(context: vscode.ExtensionContext) {
		if (context.storageUri) {
			if (!fs.existsSync(context.storageUri.path)) {
				fs.mkdirSync(context.storageUri.path);
			}
			this.resultsStoragePath = path.join(context.storageUri.path, ".tfsec_results.json");
		}
	}

	refresh(): void {
		this.taintResults = true;
		this._onDidChangeTreeData.fire();
	}

	// when there is a tfsec output file, load the results
	loadResultData() {
		if (this.resultsStoragePath !== "" && vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
			this.rootpath = vscode.workspace.workspaceFolders[0].uri.path;
			if (fs.existsSync(this.resultsStoragePath)) {
				
				const data = JSON.parse(fs.readFileSync(this.resultsStoragePath, 'utf-8'));
				this.resultData = [];
				if (data === null || data.results === null) {
					return;
				}
				for (let i = 0; i < data.results.length; i++) {
					const element = data.results[i];
					this.resultData.push(new ResultData(element));
				}
				this.taintResults = !this.taintResults;
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
			items = this.getCurrentTfsecIssues();
		} else if (element.collapsibleState !== vscode.TreeItemCollapsibleState.None) {
			items = this.getIssuesLocationsByCode(element.code);
		}
		return Promise.resolve(items);
	}

	private getCurrentTfsecIssues(): TfsecTreeItem[] {
		var results: TfsecTreeItem[] = [];
		var codes: string[] = [];


		if (this.taintResults) {
			this.loadResultData();
		}

		for (let index = 0; index < this.resultData.length; index++) {
			const result = this.resultData[index];

			if (codes.includes(result.code)) {
				continue;
			}
			codes.push(result.code);
			results.push(new TfsecTreeItem(result.code, result, vscode.TreeItemCollapsibleState.Collapsed));
		}
		return results.sort(sortByCode);
	}

	getIssuesLocationsByCode(code: string): TfsecTreeItem[] {
		var results: TfsecTreeItem[] = [];

		const filtered = this.resultData.filter(c => c.code === code);
		for (let index = 0; index < filtered.length; index++) {
			const result = filtered[index];
			if (result.code !== code) {
				continue;
			}
			let filename = result.filename.replace(this.rootpath, "");
			const cmd = this.createCommand(result);
			var item = new TfsecTreeItem(`${filename}:${result.startLine}`, result, vscode.TreeItemCollapsibleState.None, cmd);
			results.push(item);
		}
		return uniqueLocations(results);
	}

	private createCommand(result: ResultData) {
		return {
			command: "vscode.open",
			title: "",
			arguments: [
				vscode.Uri.parse(result.filename),
				{
					selection: new vscode.Range(new vscode.Position(result.startLine - 1, 0), new vscode.Position(result.endLine, 0)),
				}
			]
		};
	}
}


