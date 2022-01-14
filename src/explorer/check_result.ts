import { capitalize } from './utils';


export class CheckResult {
	public code: string;
	public provider: string;
	public codeDescription: string;
	public filename: string;
	public startLine: number;
	public endLine: number;
	public severity: string;
	public summary: string;
	public impact: string;
	public resolution: string;
	public docUrl: any;
	constructor(
		result: any
	) {
		this.code = result.long_id ?? result.rule_id;
		this.provider = result.rule_provider;
		this.codeDescription = result.rule_description;
		this.summary = result.description;
		this.impact = result.impact;
		this.resolution = result.resolution;
		this.filename = result.location.filename;
		this.startLine = result.location.start_line;
		this.endLine = result.location.end_line;
		this.severity = capitalize(result.severity);

		if (result.links.length > 0) {
			this.docUrl = result.links[0];
		}
	}
}

export class CheckSeverity {
	public severity: string;
	constructor(result: any) {
		this.severity = capitalize(result.severity);
	}
}