import {Hono, Context} from 'hono';
import {randomUUID} from 'crypto';
import {CodeJudge} from '../domain/code-judge.js';
import {Submission} from '../domain/submission.js';
import {RunRequestSchema} from '../schema.js';
import {ValidationError, ExecutionInfraError} from '../errors.js';
import type {Logger} from '../logging/logger.js';

function createSubmissionRoutes(codeJudge: CodeJudge, logger: Logger): Hono {
    const router = new Hono();

    router.post('/', createRunHandler(codeJudge, logger));

    router.get('/:id', async (c: Context) =>{
        return c.json({error: 'Not implemented'}, 501);
    });

    return router;
}

function createRunHandler(codeJudge: CodeJudge, rootLogger: Logger) {
    return async (c: Context) =>{
        const requestId = randomUUID();
        const reqLogger = rootLogger.child({requestId, route:'/submissions'});
        
        // リクエストのバリデーション確認
        const parsed = RunRequestSchema.safeParse(await c.req.json());
        if(parsed.success === false){
            reqLogger.warn('validation_failed', {issues: parsed.error.issues});
            return c.json({error: 'Invalid request', details: parsed.error.issues, requestId}, 400);
        }

        // Submissionデータモデルオブジェクトの生成
        const submission = new Submission(parsed.data);
        
        // submissionの処理を実行及び例外処理
        try{
            const result = await codeJudge.judge(submission, reqLogger);
            return c.json({ret: result, requestId: submission.id}, 200);
        } catch(err){
            if(err instanceof ValidationError){
                return c.json({error: err.message, requestId: submission.id}, 400);
            }
            if(err instanceof ExecutionInfraError){
                reqLogger.warn('infra_error', {message: err.message, details:err.details});
                return c.json({error: 'Execution infrastructure error', requestId: submission.id}, 503);
            }
            reqLogger.error('unexpected_error', {message: err instanceof Error ? err.message : String(err)});
            return c.json({error:"internal_error", requestId: submission.id}, 500);
        }
    };
}

export {createSubmissionRoutes};