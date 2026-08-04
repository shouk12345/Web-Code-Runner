import {describe, it, expect, vi} from 'vitest';
import { CodeJudge } from '../code-judge.js';
import { Submission } from '../submission.js';
import type { ExecutionBackend, ExecutionSpec, ExecutionSession } from '../execution-backend.js';
import type { RawExecResult } from '../judge.js';
import { nullLogger } from '../../logging/null-logger.js';

class FakeSession implements ExecutionSession{
    private callIndex = 0;
    closeCalled = false;

    constructor(private results: RawExecResult[]){}

    async run(_stdin: string, _timeoutSec: number):Promise<RawExecResult>{
        const result = this.results[this.callIndex];
        this.callIndex += 1;
        return result;
    }

    async close() : Promise<void>{
        this.closeCalled = true;
    }
}

class FakeExecutionBackend implements ExecutionBackend{
    lastSpec : ExecutionSpec | null = null;
    session : FakeSession;

    constructor(results : RawExecResult[]){
        this.session = new FakeSession(results);
    }

    async openSession(spec: ExecutionSpec): Promise<ExecutionSession> {
        this.lastSpec = spec;
        return this.session;
    }
}

function makeSubmission(cases: {stdin: string, stdout: string}[]){
    return new Submission({code: 'console.log(1)', cases, language: 'node'});
}

describe('CodeJudge.judge',()=>{
    it('Should call session.run for each test case and evaluate then individually', async ()=>{
        const backend = new FakeExecutionBackend([
            {exitCode: 0, signal: null, stdout:'ok', stderr:''},
            {exitCode: 1, signal: null, stdout:'', stderr:'error case'},
        ]);
        const codeJudge = new CodeJudge(backend, nullLogger);

        const submission = makeSubmission([
            {stdin:'', stdout: 'ok'},
            {stdin:'', stdout: 'anything'},
        ]);

        const results = await codeJudge.judge(submission, nullLogger);

        expect(results).toHaveLength(2);
        expect(results[0].result).toBe('AC');
        expect(results[1].result).toBe('RE');
    });

    it('Should assemble the spec with the language-specific image and timeout, then pass it to the backend',async ()=>{
        const backend = new FakeExecutionBackend([{exitCode: 0, signal: null, stdout:'',stderr:''}]);
        const codeJudge = new CodeJudge(backend, nullLogger);

        await codeJudge.judge(makeSubmission([{stdin: '', stdout:''}]), nullLogger);

        expect(backend.lastSpec?.image).toBe('runner-node:latest');
        expect(backend.lastSpec?.limits.timeoutSec).toBe(5);
    });

    it('Should ensure session.close is always called if an exception occurs during test cases to prevent container leaks', async ()=>{
        const backend = new FakeExecutionBackend([]);
        // Replace run with a spy to force it to throw an exception
        vi.spyOn(backend.session, 'run').mockRejectedValueOnce(new Error('docker daemon down'));
        const codeJudge = new CodeJudge(backend, nullLogger);

        await expect(codeJudge.judge(makeSubmission([{stdin:'', stdout:''}]), nullLogger)).rejects.toThrow();

        expect(backend.session.closeCalled).toBe(true);
    });

    it('Open and immediately close the session when test case is 0 (empty array endge case)', async ()=>{
        const backend = new FakeExecutionBackend([]);
        const codeJudge = new CodeJudge(backend, nullLogger);

        const results = await codeJudge.judge(makeSubmission([]), nullLogger);

        expect(results).toEqual([]);
        expect(backend.session.closeCalled).toBe(true);
    });
});