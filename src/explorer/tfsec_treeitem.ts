import * as vscode from 'vscode';
import * as path from 'path';
import { CheckResult, CheckSeverity } from './check_result';

export class TfsecTreeItem extends vscode.TreeItem {

	treeItemType: TfsecTreeItemType;
	code: string;
	provider: string;
	startLineNumber: number;
	endLineNumber: number;
	filename: string;
	severity: string;
	contextValue = '';

	constructor(
		public readonly title: string,
		public readonly check: CheckResult | CheckSeverity,
		public collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
	) {
		super(title, collapsibleState);
		this.severity = check.severity;

		if (check instanceof CheckResult) {
			this.tooltip = `${check.codeDescription}`;
			this.code = check.code;
			this.provider = check.provider;
			this.description = check.codeDescription;

			if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
				this.treeItemType = TfsecTreeItemType.issueLocation;
				this.contextValue = "TFSEC_FILE_LOCATION";
				this.startLineNumber = check.startLine;
				this.endLineNumber = check.endLine;
				this.filename = check.filename;
			} else {
				this.treeItemType = TfsecTreeItemType.issueCode;
				this.contextValue = "TFSEC_CODE";
				this.startLineNumber = 0;
				this.endLineNumber = 0;
				this.filename = "";
			}

		} else {
			this.code = "";
			this.provider = "";
			this.startLineNumber = 0;
			this.endLineNumber = 0;
			this.filename = "";
			this.treeItemType = TfsecTreeItemType.issueSeverity;
			this.contextValue = "TFSEC_SEVERITY";
		}



	}

	iconPath = {
		light: path.join(__filename, '..', 'resources', 'light', 'shield.svg'),
		dark: path.join(__filename, '..', 'resources', 'dark', 'shield.svg')
	};
}

export enum TfsecTreeItemType {
	issueCode = 0,
	issueLocation = 1,
	issueSeverity = 2,
}