"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TfSecCheck = void 0;
var TfSecCheck = /** @class */ (function () {
    function TfSecCheck(codeBlock) {
        this.code = codeBlock.code;
        this.provider = codeBlock.provider;
        this.summary = codeBlock.description;
        this.impact = codeBlock.impact;
        this.resolution = codeBlock.resolution;
        this.docUrl = codeBlock.doc_url;
    }
    ;
    return TfSecCheck;
}());
exports.TfSecCheck = TfSecCheck;
;
