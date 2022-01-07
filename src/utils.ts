
import * as vscode from 'vscode';
import * as cp from 'child_process';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';


function getSeverityPosition(severity: string): number {
    switch (severity) {
        case 'Critical':
            return 0;
        case 'High':
            return 1;
        case 'Medium':
            return 2;
        case 'Low':
            return 3;
        default:
            return -1;
    }
}

const sortByCode = (a: TfsecTreeItem, b: TfsecTreeItem): number => {
    if (a.code
        > b.code) {
        return 1;
    } else if (a.code < b.code) {
        return -1;
    }
    return 0;
};

const sortBySeverity = (a: TfsecTreeItem, b: TfsecTreeItem): number => {
    if (getSeverityPosition(a.severity) > getSeverityPosition(b.severity)) {
        return 1;
    } else if (getSeverityPosition(a.severity) < getSeverityPosition(b.severity)) {
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
    let last = input[0];
    if (last === undefined) {
        return [];
    }
    output.push(last);

    for (let index = 1; index < input.length; index++) {
        const element = input[index];
        if (element === undefined) {
            continue;
        }
        if (last?.code !== element?.code || last?.filename !== element?.filename || last?.startLineNumber !== element?.startLineNumber) {
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
            if (t === undefined) {
                continue;
            }
            if (t.name === "tfsec") {
                return t;
            }
        }
    }
    return vscode.window.createTerminal("tfsec");
};

const getInstalledTfsecVersion = () => {
    const config = vscode.workspace.getConfiguration('tfsec');
    var binary = config.get('binaryPath', 'tfsec');
    if (binary === "") {
        binary = "tfsec";
    }

    var command = [];
    command.push(binary);
    command.push('--version');
    const getVersion = cp.execSync(command.join(" "), { "shell": "/usr/bin/bash" });
    return getVersion.toString();
};

const capitalize = (s: string) => (s && s[0] && s[0].toUpperCase() + s.slice(1).toLowerCase()) || "";

export { sortByCode, sortBySeverity, uniqueLocations, getOrCreateTfsecTerminal, getInstalledTfsecVersion, capitalize };