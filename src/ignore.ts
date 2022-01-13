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

class FileIgnores {
    public constructor(public readonly filename: string, public readonly ignores: IgnoreDetails[]) { }
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

const addIgnore = async (filename: string, ignores: IgnoreDetails[], outputChannel: vscode.OutputChannel): Promise<void> => {
    if (!filename.endsWith(".tf")) {
        outputChannel.appendLine(`${filename} is not a tf file`);
        return Promise.resolve();
    }

    ignores = ignores.sort(function (a: IgnoreDetails, b: IgnoreDetails): number {
        if (a.startLine > b.startLine) {
            return 1;
        } else if (a.startLine < b.startLine) {
            return -1;
        }
        return 0;
    });


    await vscode.window.showTextDocument(vscode.Uri.file(filename)).then(e => {
        e.edit(edit => {
            for (let index = 0; index < ignores.length; index++) {
                let element = ignores[index];

                if (element === undefined) { continue; }
                const ignoreCode = `#tfsec:ignore:${element.code}`;
                outputChannel.appendLine(`Adding ignore for ${ignoreCode}`);
                var ignoreLine: vscode.TextLine | undefined;
                var startPos: number | undefined;
                if (element.startLine === element.endLine) {
                    let errorLine = vscode.window.activeTextEditor?.document.lineAt(element.startLine);
                    if (errorLine !== null && errorLine !== undefined) {
                        let ignoreLinePos = element.startLine;
                        ignoreLine = vscode.window.activeTextEditor?.document.lineAt(ignoreLinePos);
                        startPos = ignoreLine?.text.length;
                    }
                } else {
                    let ignoreLinePos = element.startLine;
                    ignoreLine = vscode.window.activeTextEditor?.document.lineAt(ignoreLinePos);
                }
                if (ignoreLine === undefined || ignoreLine.text.includes(ignoreCode)) {
                    continue;
                }
                if (ignoreLine !== undefined && ignoreLine.text !== undefined && ignoreLine.text.includes('tfsec:')) {
                    edit.insert(new vscode.Position(ignoreLine.lineNumber - 1, 0), `${ignoreCode}\n`);
                } else {
                    if (startPos === undefined) {
                        startPos = 0;
                    }
                    edit.insert(new vscode.Position(ignoreLine.lineNumber - 1, 0), `${ignoreCode}\n`);
                }
            }
        });
        e.document.save();
    });
};

export { addIgnore, triggerDecoration, IgnoreDetails, FileIgnores };