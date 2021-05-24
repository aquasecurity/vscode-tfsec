"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckResult = void 0;
var CheckResult = /** @class */ (function () {
    function CheckResult(result) {
        this.result = result;
        this.code = result.rule_id;
        this.provider = result.rule_provider;
        this.codeDescription = result.rule_description;
        this.filename = result.location.filename;
        this.startLine = result.location.start_line;
        this.endLine = result.location.end_line;
    }
    return CheckResult;
}());
exports.CheckResult = CheckResult;
