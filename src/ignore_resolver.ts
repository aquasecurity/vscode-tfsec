import * as vscode from 'vscode';
import { CheckManager } from './check_manager';

let timeout: NodeJS.Timer | undefined = undefined;
let activeEditor = vscode.window.activeTextEditor;

const tfsecIgnoreDecoration = vscode.window.createTextEditorDecorationType({
	fontStyle: 'italic',
	color: new vscode.ThemeColor("editorGutter.commentRangeForeground"),
	after: {
		margin: '0 0 0 1em',
		textDecoration: 'none',
	},
	rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
});	

function triggerDecoration() {
	const config = vscode.workspace.getConfiguration('tfsec');
	if (!config.get<boolean>('resolveIgnoreCodes', true)) {
		return;
	}
	if (timeout) {
		clearTimeout(timeout);
		timeout = undefined;
	}
	timeout = setTimeout(updateTfsecIgnoreDecorators, 500);
}

function updateTfsecIgnoreDecorators() {
	if (!activeEditor) {
		return;
	}
	const regEx = /tfsec:ignore:([A-Z]+?\d{3})/g;
	const text = activeEditor.document.getText();
	const tfsecIgnores: vscode.DecorationOptions[] = [];

	let match;
	while ((match = regEx.exec(text))) {
		const startPos = activeEditor.document.positionAt(match.index);
		const endPos = activeEditor.document.positionAt(match.index + match[0].length);
		const message = getTfsecDescription(match[1]);
		const decoration = { range: new vscode.Range(startPos, endPos), renderOptions: { after: {fontStyle: 'italic', contentText : message, color: new vscode.ThemeColor("editorGutter.commentRangeForeground") }}};
		tfsecIgnores.push(decoration);
	}
	activeEditor.setDecorations(tfsecIgnoreDecoration, tfsecIgnores);
}

function getTfsecDescription(tfsecCode :string) {
	var check = CheckManager.getInstance().get(tfsecCode);
	if (check === undefined) {
		return "[Uknown tfsec code]";
	}
	return check.summary;
}

export {triggerDecoration};