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
exports.triggerDecoration = void 0;
var vscode = __importStar(require("vscode"));
var check_manager_1 = require("./check_manager");
var timeout = undefined;
var activeEditor = vscode.window.activeTextEditor;
var tfsecIgnoreDecoration = vscode.window.createTextEditorDecorationType({
    fontStyle: 'italic',
    color: new vscode.ThemeColor("editorGutter.commentRangeForeground"),
    after: {
        margin: '0 0 0 1em',
        textDecoration: 'none',
    },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
});
function triggerDecoration() {
    var config = vscode.workspace.getConfiguration('tfsec');
    if (!config.get('resolveIgnoreCodes', true)) {
        return;
    }
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    timeout = setTimeout(updateTfsecIgnoreDecorators, 500);
}
exports.triggerDecoration = triggerDecoration;
function updateTfsecIgnoreDecorators() {
    if (!activeEditor) {
        return;
    }
    var regEx = /tfsec:ignore:([A-Z]+?\d{3})/g;
    var text = activeEditor.document.getText();
    var tfsecIgnores = [];
    var match;
    while ((match = regEx.exec(text))) {
        var startPos = activeEditor.document.positionAt(match.index);
        var endPos = activeEditor.document.positionAt(match.index + match[0].length);
        var message = getTfsecDescription(match[1]);
        var decoration = { range: new vscode.Range(startPos, endPos), renderOptions: { after: { fontStyle: 'italic', contentText: message, color: new vscode.ThemeColor("editorGutter.commentRangeForeground") } } };
        tfsecIgnores.push(decoration);
    }
    activeEditor.setDecorations(tfsecIgnoreDecoration, tfsecIgnores);
}
function getTfsecDescription(tfsecCode) {
    var check = check_manager_1.CheckManager.getInstance().get(tfsecCode);
    if (check === undefined) {
        return "[Uknown tfsec code]";
    }
    return check.summary;
}
