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
exports.getInstalledTfsecVersion = exports.getOrCreateTfsecTerminal = exports.uniqueLocations = exports.sortByCode = void 0;
var vscode = __importStar(require("vscode"));
var cp = __importStar(require("child_process"));
var sortByCode = function (a, b) {
    if (a.code
        > b.code) {
        return 1;
    }
    else if (a.code < b.code) {
        return -1;
    }
    return 0;
};
exports.sortByCode = sortByCode;
var sortByLineNumber = function (a, b) {
    if (a.startLineNumber > b.startLineNumber) {
        return 1;
    }
    else if (a.startLineNumber < b.startLineNumber) {
        return -1;
    }
    return 0;
};
var uniqueLocations = function (input) {
    if (input.length === 0) {
        return input;
    }
    input.sort(sortByLineNumber);
    var output = [];
    var last = input[0];
    output.push(last);
    for (var index = 1; index < input.length; index++) {
        var element = input[index];
        if (last.code !== element.code || last.filename !== element.filename || last.startLineNumber !== element.startLineNumber) {
            output.push(element);
            last = element;
        }
    }
    return output;
};
exports.uniqueLocations = uniqueLocations;
var getOrCreateTfsecTerminal = function () {
    if (vscode.window.terminals.length > 0) {
        for (var i = 0; i < vscode.window.terminals.length; i++) {
            var t = vscode.window.terminals[i];
            if (t.name === "tfsec") {
                return t;
            }
        }
    }
    return vscode.window.createTerminal("tfsec");
};
exports.getOrCreateTfsecTerminal = getOrCreateTfsecTerminal;
var getInstalledTfsecVersion = function () {
    var getVersion = cp.execSync("tfsec --version");
    return getVersion.toString();
};
exports.getInstalledTfsecVersion = getInstalledTfsecVersion;
