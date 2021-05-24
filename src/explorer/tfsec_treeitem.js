"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.TfsecTreeItem = void 0;
var vscode = __importStar(require("vscode"));
var path = __importStar(require("path"));
var TfsecTreeItem = /** @class */ (function (_super) {
    __extends(TfsecTreeItem, _super);
    function TfsecTreeItem(title, checkResult, collapsibleState, command) {
        var _this = _super.call(this, title, collapsibleState) || this;
        _this.title = title;
        _this.collapsibleState = collapsibleState;
        _this.command = command;
        _this.contextValue = '';
        _this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        _this.tooltip = "" + checkResult.codeDescription;
        _this.code = checkResult.code;
        _this.provider = checkResult.provider;
        _this.description = checkResult.codeDescription;
        _this.startLineNumber = checkResult.startLine;
        _this.endLineNumber = checkResult.endLine;
        _this.filename = checkResult.filename;
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            _this.treeItemType = TfsecTreeItemType.issueLocation;
            _this.contextValue = "TFSEC_FILE_LOCATION";
        }
        else {
            _this.treeItemType = TfsecTreeItemType.issueCode;
            _this.contextValue = "TFSEC_CODE";
        }
        return _this;
    }
    return TfsecTreeItem;
}(vscode.TreeItem));
exports.TfsecTreeItem = TfsecTreeItem;
var TfsecTreeItemType;
(function (TfsecTreeItemType) {
    TfsecTreeItemType[TfsecTreeItemType["issueCode"] = 0] = "issueCode";
    TfsecTreeItemType[TfsecTreeItemType["issueLocation"] = 1] = "issueLocation";
})(TfsecTreeItemType || (TfsecTreeItemType = {}));
