import * as path from 'path';
import * as fs from 'fs';
import {TfSecCheck} from './tfsec_check';

export class CheckManager {
    private static instance: CheckManager;
    private loadedCodes: { [key: string]: TfSecCheck} ={};
    
    private constructor() {};

    static getInstance(): CheckManager {
        if (!CheckManager.instance) {
            CheckManager.instance = new CheckManager();
            CheckManager.instance.load();
        }
    
        return CheckManager.instance;
      };
      
    load() {
        const codesFile = path.join(__filename, '..', '..', 'resources', 'codes.json');
        if (fs.existsSync(codesFile)) {
            let content = fs.readFileSync(codesFile, 'utf8');
            const checks = JSON.parse(content);
            for (let index = 0; index < checks.checks.length; index++) {
                const check = checks.checks[index];
                this.loadedCodes[check.code]  = new TfSecCheck(check);
            }
        }
    };
    
    get(code: string): TfSecCheck | undefined {
        return this.loadedCodes[code];
    };
};