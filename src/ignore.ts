import * as vscode from 'vscode';
import { CheckManager } from './check_manager';
import { TfsecIssueProvider } from './explorer/issues_treeview';
import { TfsecTreeItem, TfsecTreeItemType } from './explorer/tfsec_treeitem';

let timeout: NodeJS.Timer | undefined = undefined;
let activeEditor = vscode.window.activeTextEditor;
import * as path from 'path';

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

function rerunIfRequired() {
    const config = vscode.workspace.getConfiguration('tfsec');
    var reRunOnIgnore = config.get('runOnIgnore', true);
    if (reRunOnIgnore) {
        setTimeout(() => { vscode.commands.executeCommand("tfsec.run"); }, 1000);
    } else {
        vscode.window.showInformationMessage("You should refresh the treeview after ignoring");
    };
}

async function addIgnore(filename: string, ignores: IgnoreDetails[], outputChannel: vscode.OutputChannel): Promise<void> {
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

const ignoreInstance = (element: TfsecTreeItem, outputChannel: vscode.OutputChannel) => {
    const details = [new IgnoreDetails(element.code, element.startLineNumber, element.endLineNumber)];
    addIgnore(element.filename, details, outputChannel);

    rerunIfRequired();
};


const ingorePath = (element: any) => {

    if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]) {
        const rootpath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration("tfsec");
        let excludedPaths = config.get<string[]>("excludedPaths");

        var filepath = element.fsPath;
        filepath = path.relative(rootpath, filepath);

        excludedPaths?.push(filepath);
        excludedPaths = [...new Set(excludedPaths?.map(obj => obj))];

        config.update("excludedPaths", excludedPaths, false);
    }
};

const ignoreAllInstances = async (element: TfsecTreeItem, issueProvider: TfsecIssueProvider, outputChannel: vscode.OutputChannel) => {
    outputChannel.show();
    outputChannel.appendLine("\nSetting ignores - ");

    var seenIgnores: string[] = [];
    var ignoreMap = new Map<string, IgnoreDetails[]>();

    let severityIgnore = element.treeItemType === TfsecTreeItemType.issueSeverity;
    for (let index = 0; index < issueProvider.resultData.length; index++) {
        var r = issueProvider.resultData[index];
        if (r === undefined) {
            continue;
        }
        let ignores = ignoreMap.get(r.filename);
        if (!ignores) {
            ignores = [];
        }

        if (severityIgnore && r.severity !== element.severity) { continue; }
        if (!severityIgnore && r.code !== element.code) { continue; }

        let ingoreKey = `${r.filename}:${r.code}:${r.startLine}:${r.endLine}`;
        if (seenIgnores.includes(ingoreKey)) {
            continue;
        }
        seenIgnores.push(ingoreKey);
        ignores.push(new IgnoreDetails(r.code, r.startLine, r.endLine));
        ignoreMap.set(r.filename, ignores);
    }

    var edits: FileIgnores[] = [];
    ignoreMap.forEach((ignores: IgnoreDetails[], filename: string) => {
        edits.push(new FileIgnores(filename, ignores));
    });

    await edits.reduce(
        (p, x) =>
            p.then(_ => addIgnore(x.filename, x.ignores, outputChannel)),
        Promise.resolve()
    ).then(() => {
        outputChannel.appendLine("Checking if re-run is enabled....");
        rerunIfRequired();
    });
};


export { ignoreAllInstances, ignoreInstance, ingorePath, triggerDecoration, IgnoreDetails, FileIgnores };