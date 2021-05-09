
import * as vscode from 'vscode';
import { TfsecTreeItem } from './explorer/tfsec_treeitem';

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

export { sortByCode, uniqueLocations, getOrCreateTfsecTerminal };