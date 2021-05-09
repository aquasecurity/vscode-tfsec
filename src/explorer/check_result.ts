export class CheckResult {
	public code: string;
	public provider: string;
	public codeDescription: string;
	public filename: string;
	public startLine: number;
	public endLine: number;
	constructor(
		private result: any
	) {
		this.code = result.rule_id;
		this.provider = result.rule_provider;
		this.codeDescription = result.rule_description;
		this.filename = result.location.filename;
		this.startLine = result.location.start_line;
		this.endLine = result.location.end_line;
	}
}