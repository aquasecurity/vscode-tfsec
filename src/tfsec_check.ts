export class TfSecCheck {
    public code: string;
    public summary: string;
    public impact: string;
    public resolution: string;
    public docUrl: any;
    public provider: any;
    constructor( codeBlock: any) {
        this.code = codeBlock.code;
        this.provider = codeBlock.provider;
        this.summary = codeBlock.description;
        this.impact = codeBlock.impact;
        this.resolution = codeBlock.resolution;
        this.docUrl = codeBlock.doc_url;
    };
};