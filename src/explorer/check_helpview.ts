import { CancellationToken, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from "vscode";
import { CheckResult, CheckSeverity } from "./check_result";
import { TfsecTreeItem } from "./tfsec_treeitem";

export class TfsecHelpProvider implements WebviewViewProvider {
    private view: Webview | undefined;

    resolveWebviewView(webviewView: WebviewView, _context: WebviewViewResolveContext<unknown>, _token: CancellationToken): void | Thenable<void> {
        this.view = webviewView.webview;
        this.update(null);
    }

    update(item: TfsecTreeItem | null) {
        if (this.view === undefined) {
            return;
        }
        if (item === null) {
            return;
        }
        const codeData = item.check;
        if (codeData === undefined) {
            this.view.html = `
<h2>No check data available</h2>
This check may no longer be valid. Check your tfsec is the latest version.
`;
            return;
        }

        if (item.contextValue === 'TFSEC_CODE') {
            this.view.html = `
            <h2>Select a specific instance for more details</h2>
For more information about the issue found, select a specific instance.
            `;
            return;
        }
        this.view.html = getHtml(codeData);
    }
}

function getHtml(codeData: CheckResult | CheckSeverity | undefined): string {
    if (codeData === undefined || codeData instanceof CheckSeverity) {
        return "";
    }
    return `
    <h2>${codeData?.codeDescription}</h2>
    ${codeData?.summary}

    <h3>ID</h3>
    ${codeData?.code}

    <h3>Severity</h3>
    ${codeData?.severity}

    <h3>Impact</h3>
    ${codeData?.impact}

    <h3>Resolution</h3>
    ${codeData?.resolution}

    <h3>Filename</h3>
    ${codeData?.filename}

    <h3>More Information</h3>
    <a href="${codeData?.docUrl}">${codeData?.docUrl}</a>
    `;
}
