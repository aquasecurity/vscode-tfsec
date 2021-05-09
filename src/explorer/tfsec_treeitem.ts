import * as vscode from 'vscode';
import * as path from 'path';
import { CheckResult } from './check_result';

export class TfsecTreeItem extends vscode.TreeItem {

	treeItemType: TfsecTreeItemType;
    code: string;
	provider: string;
	startLineNumber: number;
	endLineNumber: number;
	filename: string;
    contextValue = '';

	constructor(
		public readonly title: string,
		checkResult: CheckResult,
		public collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
	) {
		super(title, collapsibleState);
		this.tooltip = `${checkResult.codeDescription}`;
        this.code = checkResult.code;
		this.provider = checkResult.provider;
		this.description = checkResult.codeDescription;
		this.startLineNumber = checkResult.startLine;
		this.endLineNumber = checkResult.endLine;
		this.filename = checkResult.filename;

		if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
			this.treeItemType = TfsecTreeItemType.issueLocation;
            this.contextValue = "TFSEC_FILE_LOCATION";
		} else {
			this.treeItemType = TfsecTreeItemType.issueCode;
			this.contextValue = "TFSEC_CODE";
		}
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark:  path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};
}

enum TfsecTreeItemType {
	issueCode = 0,
	issueLocation = 1,
}