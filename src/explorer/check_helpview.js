"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TfsecHelpProvider = void 0;
var check_manager_1 = require("../check_manager");
var TfsecHelpProvider = /** @class */ (function () {
    function TfsecHelpProvider() {
    }
    TfsecHelpProvider.prototype.resolveWebviewView = function (webviewView, context, token) {
        this.view = webviewView.webview;
        this.update(null);
    };
    TfsecHelpProvider.prototype.update = function (item) {
        if (this.view === undefined) {
            return;
        }
        if (item === null) {
            return;
        }
        var codeData = check_manager_1.CheckManager.getInstance().get(item.code);
        if (codeData === undefined) {
            this.view.html = "\n<h2>No check data available</h2>\nThis check may no longer be valid. Check your tfsec is the latest version.\n";
            return;
        }
        this.view.html = getHtml(codeData);
    };
    return TfsecHelpProvider;
}());
exports.TfsecHelpProvider = TfsecHelpProvider;
function getHtml(codeData) {
    if (codeData === undefined) {
        return "";
    }
    return "\n    <h2>" + (codeData === null || codeData === void 0 ? void 0 : codeData.code) + "</h2>\n    " + (codeData === null || codeData === void 0 ? void 0 : codeData.summary) + "\n\n    <h3>Impact</h3>\n    " + (codeData === null || codeData === void 0 ? void 0 : codeData.impact) + "\n\n    <h3>Resolution</h3>\n    " + (codeData === null || codeData === void 0 ? void 0 : codeData.resolution) + "\n\n    <h3>More Information</h3>\n    <a href=\"" + (codeData === null || codeData === void 0 ? void 0 : codeData.docUrl) + "\">" + (codeData === null || codeData === void 0 ? void 0 : codeData.docUrl) + "</a>\n    ";
}
