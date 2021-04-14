import * as vscode from 'vscode';
import * as path from 'path';
import { ResultData } from './result_data';

export class TfsecTreeItem extends vscode.TreeItem {

	treeItemType: TfsecTreeItemType;
    code: string;
	provider: string;
	lineNumber: number;
	filename: string;
    contextValue = '';

	constructor(
		public readonly title: string,
		resultData: ResultData,
		public collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
	) {
		super(title, collapsibleState);
		this.tooltip = `${resultData.codeDescription}`;
        this.code = resultData.code;
		this.provider = resultData.provider;
		this.description = resultData.codeDescription;
		this.lineNumber = resultData.startLine;
		this.filename = resultData.filename;

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
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	
}

enum TfsecTreeItemType {
	issueCode = 0,
	issueLocation = 1,
}