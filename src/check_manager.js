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
exports.CheckManager = void 0;
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var tfsec_check_1 = require("./tfsec_check");
var CheckManager = /** @class */ (function () {
    function CheckManager() {
        this.loadedCodes = {};
    }
    ;
    CheckManager.getInstance = function () {
        if (!CheckManager.instance) {
            CheckManager.instance = new CheckManager();
            CheckManager.instance.load();
        }
        return CheckManager.instance;
    };
    ;
    CheckManager.prototype.load = function () {
        var codesFile = path.join(__filename, '..', '..', 'resources', 'codes.json');
        if (fs.existsSync(codesFile)) {
            var content = fs.readFileSync(codesFile, 'utf8');
            var checks = JSON.parse(content);
            for (var index = 0; index < checks.checks.length; index++) {
                var check = checks.checks[index];
                this.loadedCodes[check.code] = new tfsec_check_1.TfSecCheck(check);
            }
        }
    };
    ;
    CheckManager.prototype.get = function (code) {
        return this.loadedCodes[code];
    };
    ;
    return CheckManager;
}());
exports.CheckManager = CheckManager;
;
