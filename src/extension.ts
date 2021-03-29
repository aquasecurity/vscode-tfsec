import * as vscode from 'vscode';
import { Codes } from './codes';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('tfsec ignore decorator activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate small numbers
	const tfsecIgnoreDecoration = vscode.window.createTextEditorDecorationType({
		fontStyle: 'italic',
		color: new vscode.ThemeColor("editorGutter.commentRangeForeground"),
		after: {
			margin: '0 0 0 3em',
			textDecoration: 'none',
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
	});


	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
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
			const message = getTfsecDescription(match[1])
			const decoration = { range: new vscode.Range(startPos, endPos), renderOptions: { after: {fontStyle: 'italic', contentText : message, color: new vscode.ThemeColor("editorGutter.commentRangeForeground") }}};
			tfsecIgnores.push(decoration);
		}
		activeEditor.setDecorations(tfsecIgnoreDecoration, tfsecIgnores);
	}

	function getTfsecDescription(tfsecCode :string) {
		return Codes.get(tfsecCode);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

}