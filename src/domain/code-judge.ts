import {Submission} from "./submission.js";
import {ExecutionPolicy} from "./execution-policy.js";
import {Judge, type JudgeResult} from "./judge.js";
import type {ExecutionBackend, ExecutionSpec} from "./execution-backend.js";
import type {Logger} from "../logging/logger.ts";

class CodeJudge{
    constructor(private backend: ExecutionBackend, private logger: Logger){}

    async judge(submission: Submission, logger: Logger) : Promise<JudgeResult[]>{
        const reqLogger = logger.child({requestId: submission.id});
        reqLogger.info('judge_start', {caseCount: submission.cases.length, language: submission.language});

        const limits = ExecutionPolicy.limitsFor(submission.language);
        const spec : ExecutionSpec = {
            code: submission.code,
            image: ExecutionPolicy.imageFor(submission.language),
            entrypoint: ExecutionPolicy.entrypointFor(submission.language),
            limits,
            runtime: ExecutionPolicy.runtimeFor()
        };

        const session = await this.backend.openSession(spec, reqLogger);
        try{
            const results : JudgeResult[] = [];
            for(const testCase of submission.cases){
                const raw = await session.run(testCase.stdin, limits.timeoutSec);
                results.push(Judge.Check(raw, testCase.stdout));
            }

            reqLogger.info('judge_end', {results: results.map((r) =>r.result)});
            return results;
        } catch(err){
            reqLogger.error('judge_failed', {message: err instanceof Error ? err.message : String(err)});
            throw err;
        } finally{
            await session.close();
        }
    }
}

export {CodeJudge};