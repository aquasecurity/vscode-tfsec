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
exports.TfsecIssueProvider = void 0;
var vscode = __importStar(require("vscode"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var utils_1 = require("../utils");
var check_result_1 = require("./check_result");
var tfsec_treeitem_1 = require("./tfsec_treeitem");
var TfsecIssueProvider = /** @class */ (function () {
    function TfsecIssueProvider(context, tfsecHelpProvider) {
        this.tfsecHelpProvider = tfsecHelpProvider;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.resultData = [];
        this.taintResults = true;
        this.rootpath = "";
        this.storagePath = "";
        this.resultsStoragePath = "";
        if (context.storageUri) {
            this.storagePath = context.storageUri.fsPath;
            console.log("storage path is " + this.storagePath);
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(context.storageUri.fsPath);
            }
            this.resultsStoragePath = path.join(context.storageUri.fsPath, ".tfsec_results.json");
            if (!fs.existsSync(this.resultsStoragePath)) {
                fs.closeSync(fs.openSync(this.resultsStoragePath, 'w'));
            }
            // create the file watcher to refresh the tree when changes are made
            fs.watch(this.resultsStoragePath, function (eventType, filename) {
                if (eventType !== "change") {
                    return;
                }
                vscode.window.showInformationMessage("tfsec run complete, results file updated");
                // short wait for the file to be written before refreshing the tree
                setTimeout(function () { vscode.commands.executeCommand("tfsec.refresh"); }, 250);
            });
        }
    }
    TfsecIssueProvider.prototype.refresh = function () {
        this.taintResults = true;
        this._onDidChangeTreeData.fire();
    };
    // when there is a tfsec output file, load the results
    TfsecIssueProvider.prototype.loadResultData = function () {
        if (this.resultsStoragePath !== "" && vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            this.rootpath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            if (fs.existsSync(this.resultsStoragePath)) {
                var content = fs.readFileSync(this.resultsStoragePath, 'utf8');
                try {
                    var data = JSON.parse(content);
                    this.resultData = [];
                    if (data === null || data.results === null) {
                        return;
                    }
                    for (var i = 0; i < data.results.length; i++) {
                        var element = data.results[i];
                        this.resultData.push(new check_result_1.CheckResult(element));
                    }
                    this.taintResults = !this.taintResults;
                }
                catch (_a) {
                    console.debug("Error loading results file " + this.resultsStoragePath);
                }
            }
        }
        else {
            vscode.window.showInformationMessage("No workspace detected to load tfsec results from");
        }
    };
    TfsecIssueProvider.prototype.getTreeItem = function (element) {
        return element;
    };
    TfsecIssueProvider.prototype.getChildren = function (element) {
        // if this is refresh then get the top level codes
        var items = [];
        if (!element) {
            items = this.getCurrentTfsecIssues();
        }
        else if (element.collapsibleState !== vscode.TreeItemCollapsibleState.None) {
            items = this.getIssuesLocationsByCode(element.code);
        }
        return Promise.resolve(items);
    };
    TfsecIssueProvider.prototype.getCurrentTfsecIssues = function () {
        var results = [];
        var resolvedCodes = [];
        if (this.taintResults) {
            this.loadResultData();
        }
        for (var index = 0; index < this.resultData.length; index++) {
            var result = this.resultData[index];
            if (resolvedCodes.includes(result.code)) {
                continue;
            }
            resolvedCodes.push(result.code);
            results.push(new tfsec_treeitem_1.TfsecTreeItem(result.code, result, vscode.TreeItemCollapsibleState.Collapsed));
        }
        return results.sort(utils_1.sortByCode);
    };
    TfsecIssueProvider.prototype.getIssuesLocationsByCode = function (code) {
        var results = [];
        var filtered = this.resultData.filter(function (c) { return c.code === code; });
        for (var index = 0; index < filtered.length; index++) {
            var result = filtered[index];
            if (result.code !== code) {
                continue;
            }
            var filename = trimPrefix(result.filename.replace(this.rootpath, ""), path.sep);
            var cmd = this.createFileOpenCommand(result);
            var item = new tfsec_treeitem_1.TfsecTreeItem(filename + ":" + result.startLine, result, vscode.TreeItemCollapsibleState.None, cmd);
            results.push(item);
        }
        return utils_1.uniqueLocations(results);
    };
    TfsecIssueProvider.prototype.createFileOpenCommand = function (result) {
        var issueRange = new vscode.Range(new vscode.Position(result.startLine - 1, 0), new vscode.Position(result.endLine, 0));
        return {
            command: "vscode.open",
            title: "",
            arguments: [
                vscode.Uri.file(result.filename),
                {
                    selection: issueRange,
                }
            ]
        };
    };
    return TfsecIssueProvider;
}());
exports.TfsecIssueProvider = TfsecIssueProvider;
function trimPrefix(input, prefix) {
    var result = input;
    if (input.indexOf(prefix) === 0) {
        result = input.substr(prefix.length);
    }
    return result;
}
