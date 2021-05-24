"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
var vscode = __importStar(require("vscode"));
var ignore_resolver_1 = require("./ignore_resolver");
var issues_treeview_1 = require("./explorer/issues_treeview");
var utils_1 = require("./utils");
var check_helpview_1 = require("./explorer/check_helpview");
var semver = __importStar(require("semver"));
// this method is called when vs code is activated
function activate(context) {
    console.log('tfsec extension activated');
    var helpProvider = new check_helpview_1.TfsecHelpProvider();
    var activeEditor = vscode.window.activeTextEditor;
    var issueProvider = new issues_treeview_1.TfsecIssueProvider(context, helpProvider);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("tfsec.helpview", helpProvider));
    // creating the issue tree explicitly to allow access to events
    var issueTree = vscode.window.createTreeView("tfsec.issueview", {
        treeDataProvider: issueProvider,
    });
    issueTree.onDidChangeSelection(function (event) {
        var treeItem = event.selection[0];
        if (treeItem) {
            helpProvider.update(treeItem);
        }
    });
    context.subscriptions.push(vscode.commands.registerCommand('tfsec.refresh', function () { return issueProvider.refresh(); }));
    context.subscriptions.push(vscode.commands.registerCommand('tfsec.version', function () { return showCurrentTfsecVersion(); }));
    context.subscriptions.push(vscode.commands.registerCommand('tfsec.ignore', function (element) {
        vscode.workspace.openTextDocument(vscode.Uri.file(element.filename)).then(function (file) {
            vscode.window.showTextDocument(file, 1, false).then(function (e) {
                e.edit(function (edit) {
                    var _a;
                    if (element.startLineNumber === element.endLineNumber) {
                        var errorLine = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.lineAt(element.startLineNumber);
                        if (errorLine !== null && errorLine !== undefined) {
                            edit.insert(new vscode.Position(errorLine.lineNumber - 1, errorLine.firstNonWhitespaceCharacterIndex), "#tfsec:ignore:" + element.code + "\n");
                        }
                    }
                    else {
                        edit.insert(new vscode.Position(element.startLineNumber - 1, 0), "#tfsec:ignore:" + element.code + "\n");
                    }
                });
            });
        });
        var config = vscode.workspace.getConfiguration('tfsec');
        var reRunOnIgnore = config.get('runOnIgnore', true);
        if (reRunOnIgnore) {
            vscode.commands.executeCommand("tfsec.run");
        }
        ;
    }));
    context.subscriptions.push(vscode.commands.registerCommand("tfsec.run", function () {
        var terminal = utils_1.getOrCreateTfsecTerminal();
        terminal.show();
        if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            terminal.sendText(buildCommand(issueProvider.resultsStoragePath));
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("tfsec.updatebinary", function () {
        var currentVersion = utils_1.getInstalledTfsecVersion();
        if (semver.lt(currentVersion, "0.39.39")) {
            vscode.window.showInformationMessage("Self updating was not introduced till v0.39.39 and you are running " + currentVersion + ". Pleae update manually to at least v0.39.39");
        }
        var terminal = utils_1.getOrCreateTfsecTerminal();
        terminal.hide();
        terminal.sendText("tfsec --update");
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function (editor) {
        activeEditor = editor;
        if (editor) {
            ignore_resolver_1.triggerDecoration();
        }
    }, null, context.subscriptions));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(function (event) {
        if (activeEditor && event.document === activeEditor.document) {
            ignore_resolver_1.triggerDecoration();
        }
    }, null, context.subscriptions));
    if (activeEditor) {
        ignore_resolver_1.triggerDecoration();
    }
    showCurrentTfsecVersion();
}
exports.activate = activate;
function showCurrentTfsecVersion() {
    var currentVersion = utils_1.getInstalledTfsecVersion();
    if (currentVersion) {
        vscode.window.showInformationMessage("Current tfsec version is " + currentVersion);
    }
}
function buildCommand(resultsStoragePath) {
    var config = vscode.workspace.getConfiguration('tfsec');
    var binary = config.get('binaryPath', 'tfsec');
    if (binary === "") {
        binary = "tfsec";
    }
    var command = [];
    command.push(binary);
    if (config.get('fullDepthSearch')) {
        command.push('--force-all-dirs');
    }
    if (config.get('ignoreDownloadedModules')) {
        command.push('--exclude-downloaded-modules');
    }
    command.push('--format json');
    command.push("--out \"" + resultsStoragePath + "\"");
    return command.join(" ");
}
