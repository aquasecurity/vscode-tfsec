import * as path from 'path';
import * as vscode from 'vscode';
import * as cp from 'child_process';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';
import { existsSync } from 'fs';
import { parse } from 'semver';
import * as gitConfig from 'parse-git-config';
import { stringify } from 'querystring';
import * as git from './utils/git';

const sortByCode = (a: TfsecTreeItem, b: TfsecTreeItem): number => {
    if (a.code
        > b.code) {
        return 1;
    } else if (a.code < b.code) {
        return -1;
    }
    return 0;
};

const sortByLineNumber = (a: TfsecTreeItem, b: TfsecTreeItem): number => {
    if (a.startLineNumber > b.startLineNumber) {
        return 1;
    } else if (a.startLineNumber < b.startLineNumber) {
        return -1;
    }
    return 0;
};

const uniqueLocations = (input: TfsecTreeItem[]): TfsecTreeItem[] => {

    if (input.length === 0) {
        return input;
    }
    input.sort(sortByLineNumber);
    let output: TfsecTreeItem[] = [];
    let last: TfsecTreeItem = input[0];
    output.push(last);

    for (let index = 1; index < input.length; index++) {
        const element = input[index];
        if (last.code !== element.code || last.filename !== element.filename || last.startLineNumber !== element.startLineNumber) {
            output.push(element);
            last = element;
        }
    }

    return output;
};

const getOrCreateTfsecTerminal = () => {
    if (vscode.window.terminals.length > 0) {
        for (let i = 0; i < vscode.window.terminals.length; i++) {
            const t = vscode.window.terminals[i];
            if (t.name === "tfsec") {
                return t;
            }
        }
    }
    return vscode.window.createTerminal("tfsec");
};

const getInstalledTfsecVersion = () => {

    const getVersion = cp.execSync("tfsec --version");
    return getVersion.toString();

};

const getUrlForLocalGit = (context: vscode.ExtensionContext) => {

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0] !== null) {
        const gitConfigPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, ".git/config");

        if (existsSync(gitConfigPath)) {
            const config = gitConfig.sync({ path: gitConfigPath });

            const remoteOrigin = config['remote "origin"'];
            if (remoteOrigin) {
                const workingUrl = remoteOrigin["url"];
                if (workingUrl) {
                    return git.deriveUrl(workingUrl);
                }
            }
        }
    }
};



export { sortByCode, uniqueLocations, getOrCreateTfsecTerminal, getInstalledTfsecVersion, getUrlForLocalGit };


