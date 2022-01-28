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
		this.code = "";
		this.provider = "";
		this.startLineNumber = 0;
		this.endLineNumber = 0;
		this.filename = "";

		if (check instanceof CheckResult) {
			this.code = check.code;
			this.provider = check.provider;
			if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
				this.treeItemType = TfsecTreeItemType.issueLocation;
				this.contextValue = "TFSEC_FILE_LOCATION";
				this.startLineNumber = check.startLine;
				this.endLineNumber = check.endLine;
				this.filename = check.filename;
				this.iconPath = vscode.ThemeIcon.File;
				this.resourceUri = vscode.Uri.parse(check.filename);
			} else {
				this.treeItemType = TfsecTreeItemType.issueCode;
				this.contextValue = "TFSEC_CODE";
				this.tooltip = `${check.codeDescription}`;
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'resources', 'light', 'tfsec.svg'),
					dark: path.join(__filename, '..', '..', 'resources', 'dark', 'tfsec.svg')
				};
			}
		} else {
			this.treeItemType = TfsecTreeItemType.issueSeverity;
			this.contextValue = "TFSEC_SEVERITY";
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', this.severityIcon(this.severity)),
				dark: path.join(__filename, '..', '..', 'resources', this.severityIcon(this.severity))
			};
		}
	}

	severityIcon = (severity: string): string => {
		switch (severity) {
			case "Critical":
				return 'critical.svg';
			case "High":
				return 'high.svg';
			case "Medium":
				return 'medium.svg';
			case "Low":
				return 'low.svg';
		}
		return 'unknown.svg';
	};
}

export enum TfsecTreeItemType {
	issueCode = 0,
	issueLocation = 1,
	issueSeverity = 2,
}