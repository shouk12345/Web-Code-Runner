import {randomUUID} from "crypto"
import type {Language, TestCase} from '../schema.js'

// submission処理専用のデータモデル
class Submission {
    readonly id: string;
    readonly code: string;
    readonly cases: TestCase[];
    readonly language: Language;
    readonly submittedAt: Date;

    constructor(params: {code: string, cases: TestCase[], language: Language}){
        this.id = randomUUID();
        this.code = params.code;
        this.cases = params.cases;
        this.language = params.language;
        this.submittedAt = new Date();
    }
}

export {Submission};