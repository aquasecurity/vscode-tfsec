import * as vscode from 'vscode';
import * as child from 'child_process';
import * as semver from 'semver';

export class TfsecWrapper {
    private workingPath: string = "";
    constructor(
        private outputChannel: vscode.OutputChannel,
        private readonly resultsStoragePath: string) {
        if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
            && vscode.workspace.workspaceFolders[0] !== undefined) {
            this.workingPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        };
    }

    run() {
        let outputChannel = this.outputChannel;
        this.outputChannel.appendLine("");
        this.outputChannel.appendLine("Running tfsec to update results");

        if (!this.checkTfsecInstalled()) {
            return;
        }

        const binary = this.getBinaryPath();

        let command = this.buildCommand();
        this.outputChannel.appendLine(`command: ${command}`);

        var execution = child.spawn(binary, command);

        execution.stdout.on('data', function (data) {
            outputChannel.appendLine(data.toString());
        });

        execution.stderr.on('data', function (data) {
            outputChannel.appendLine(data.toString());
        });

        execution.on('exit', function (code) {
            if (code !== 0) {
                vscode.window.showErrorMessage("tfsec failed to run");
                return;
            };
            vscode.window.showInformationMessage('tfsec ran successfully, updating results');
            outputChannel.appendLine('Reloading the Findings Explorer content');
            setTimeout(() => { vscode.commands.executeCommand("tfsec.refresh"); }, 250);
        });
    }


    updateBinary() {
        this.outputChannel.show();
        this.outputChannel.appendLine("");
        this.outputChannel.appendLine("Checking the current version");

        if (!this.checkTfsecInstalled()) {
            return;
        }

        const currentVersion = this.getInstalledTfsecVersion();
        if (currentVersion.includes("running a locally built version")) {
            this.outputChannel.appendLine("You are using a locally built version which cannot be updated");
        }

        if (semver.lt(currentVersion, "0.39.39")) {
            vscode.window.showInformationMessage(`Self updating was not introduced till v0.39.39 and you are running ${currentVersion}. Pleae update manually to at least v0.39.39`);
        }
        this.outputChannel.appendLine("Attempting to download the latest version");
        var binary = this.getBinaryPath();
        try {
            let result: Buffer = child.execSync(binary + " --update --verbose");
            this.outputChannel.appendLine(result.toLocaleString());
        } catch (err) {
            vscode.window.showErrorMessage("There was a problem with the update, check the output window");
            let errMsg = err as Error;
            this.outputChannel.appendLine(errMsg.message);
        }
    }

    showCurrentTfsecVersion() {
        const currentVersion = this.getInstalledTfsecVersion();
        if (currentVersion) {
            vscode.window.showInformationMessage(`Current tfsec version is ${currentVersion}`);
        }
    }

    private getBinaryPath() {
        const config = vscode.workspace.getConfiguration('tfsec');
        var binary = config.get('binaryPath', 'tfsec');
        if (binary === "") {
            binary = "tfsec";
        }

        return binary;
    };

    private checkTfsecInstalled(): boolean {
        const binaryPath = this.getBinaryPath();

        var command = [];
        command.push(binaryPath);
        command.push('--help');
        try {
            child.execSync(command.join(' '));
        }
        catch (err) {
            this.outputChannel.show();
            this.outputChannel.appendLine(`tfsec not found. Check the tfsec extension settings to ensure the path is correct. [${binaryPath}]`);
            return false;
        }
        return true;
    };

    private getInstalledTfsecVersion(): string {

        if (!this.checkTfsecInstalled) {
            vscode.window.showErrorMessage("tfsec could not be found, check Output window");
            return "";
        }

        let binary = this.getBinaryPath();

        var command = [];
        command.push(binary);
        command.push('--version');
        const getVersion = child.execSync(command.join(' '));
        return getVersion.toString();
    };


    private buildCommand(): string[] {
        const config = vscode.workspace.getConfiguration('tfsec');
        var command = [];

        if (config.get<boolean>('fullDepthSearch')) {
            command.push('--force-all-dirs');
        }
        if (config.get<boolean>('ignoreDownloadedModules')) {
            command.push('--exclude-downloaded-modules');
        }

        if (config.get<boolean>('debug')) {
            command.push('--verbose');
        }

        // add soft fail for exit code
        command.push('--soft-fail');
        command.push('--format=json');
        command.push(`--out=${this.resultsStoragePath}`);
        command.push(this.workingPath);

        return command;
    }

}

