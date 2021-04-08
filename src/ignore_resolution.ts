import * as vscode from 'vscode';
import { codes } from './codes';

let activeEditor = vscode.window.activeTextEditor;

const tfsecIgnoreDecoration = vscode.window.createTextEditorDecorationType({
	fontStyle: 'italic',
	color: new vscode.ThemeColor("editorGutter.commentRangeForeground"),
	after: {
		margin: '0 0 0 3em',
		textDecoration: 'none',
	},
	rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
});

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
	let code = codes.get(tfsecCode);
	if (code === "") {
		code = "[Uknown tfsec code]";
	}
	return code;
}

export { updateTfsecIgnoreDecorators as UpdateTfsecIgnoreDecorations };