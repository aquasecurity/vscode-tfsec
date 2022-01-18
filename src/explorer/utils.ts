
import { TfsecTreeItem } from './tfsec_treeitem';


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

const sortResults = (a: any, b: any): number => {
    if (a.filename > b.filename) {
        return 1;
    } else if (a.filename < b.filename) {
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

const sortByFilename = (a: TfsecTreeItem, b: TfsecTreeItem): number => {
    if (a.filename > b.filename) {
        return 1;
    } else if (a.filename < b.filename) {
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

    return output.sort(sortByFilename);
};



const capitalize = (s: string) => (s && s[0] && s[0].toUpperCase() + s.slice(1).toLowerCase()) || '';

export { sortByCode, sortBySeverity, sortResults, uniqueLocations, capitalize };