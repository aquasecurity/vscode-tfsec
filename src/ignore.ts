import * as vscode from 'vscode';
import { CheckManager } from './check_manager';

let timeout: NodeJS.Timer | undefined = undefined;
let activeEditor = vscode.window.activeTextEditor;

class IgnoreDetails {
    public readonly code: string;
    public readonly startLine: number;
    public readonly endLine: number;
    public constructor(code: string, startLine: number, endLine: number) {
        this.code = code;
        this.startLine = startLine;
        this.endLine = endLine;
    }
}

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
        if (match[1] === undefined || match[0] === undefined) { break; }
        const startPos = activeEditor.document.positionAt(match.index);
        const endPos = activeEditor.document.positionAt(match.index + match[0].length);
        const message = getTfsecDescription(match[1]);
        const decoration = { range: new vscode.Range(startPos, endPos), renderOptions: { after: { fontStyle: 'italic', contentText: message, color: new vscode.ThemeColor("editorGutter.commentRangeForeground") } } };
        tfsecIgnores.push(decoration);
    }
    activeEditor.setDecorations(tfsecIgnoreDecoration, tfsecIgnores);
}

function getTfsecDescription(tfsecCode: string) {
    var check = CheckManager.getInstance().get(tfsecCode);
    if (check === undefined) {
        return "[Uknown tfsec code]";
    }
    return check;
}



const addIgnore = (filename: string, ignores: IgnoreDetails[]) => {
    Promise.resolve(vscode.workspace.openTextDocument(vscode.Uri.file(filename)).then((file: vscode.TextDocument) => {
        Promise.resolve(vscode.window.showTextDocument(file, 1, false).then(e => {
            e.edit(edit => {
                for (let index = 0; index < ignores.length; index++) {
                    let element = ignores[index];
                    if (element === undefined) { continue; }
                    if (element.startLine === element.endLine) {
                        let errorLine = vscode.window.activeTextEditor?.document.lineAt(element.startLine);
                        if (errorLine !== null && errorLine !== undefined) {
                            edit.insert(new vscode.Position(errorLine.lineNumber - 1, errorLine.firstNonWhitespaceCharacterIndex), `#tfsec:ignore:${element.code}\n`);
                        }
                    } else {
                        edit.insert(new vscode.Position(element.startLine - 1, 0), `#tfsec:ignore:${element.code}\n`);
                    }
                }
            });
        }));
    }));
};

export { addIgnore, triggerDecoration, IgnoreDetails };