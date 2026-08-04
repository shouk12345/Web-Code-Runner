import {describe, it, expect} from 'vitest';
import { Judge } from '../judge.js';
import type { RawExecResult } from '../judge.js';

function makeResult(overrides: Partial<RawExecResult>): RawExecResult{
    return {exitCode: 0, signal: null, stdout:'', stderr:'', ...overrides};
}

describe('judge.check', ()=>{
    // CATEGORY 1: Normal termination (exitCode 0) - Edge cases
    describe('Normal termination', ()=>{
        it('should return AC when the output matches exactly', ()=>{
            const r = makeResult({exitCode: 0, stdout: 'hello'});
            expect(Judge.Check(r, 'hello').result).toBe('AC');
        });

        it('Should return AC when only leading/trailing white spaces or newline differ', ()=>{
            const r = makeResult({exitCode:0, stdout:'  hello\n\n'});
            expect(Judge.Check(r, 'hello').result).toBe('AC');
        });

        it('Should return WA when internal whitespaces differ', ()=>{
            const r = makeResult({exitCode:0, stdout:'hello  world'});
            expect(Judge.Check(r, 'hello world').result).toBe('WA');
        });

        it('Should return AC when both output and expected value are empty', ()=>{
            const r = makeResult({exitCode:0, stdout:''});
            expect(Judge.Check(r, '').result).toBe('AC');
        });

        it('Should return AW when there is a single mismatch', ()=>{
            const r = makeResult({exitCode:0, stdout:'hellp'});
            expect(Judge.Check(r, 'hello').result).toBe('WA');
        });
    });

    // CATEGORY 2: Abnormal termination (exitCode !== 0) - Edge cases
    describe('Abnormal termination', ()=>{
        it('should return RE if exitCode is 1, even if output matches expected value (exitCode takes priority) ', ()=>{
            const r = makeResult({exitCode: 1, stdout: 'hello'});
            expect(Judge.Check(r, 'hello').result).toBe('RE');
        });

        it('Should return RE if exitCode is non-zero, even if negative(invalid code defense)', ()=>{
            const r = makeResult({exitCode: -1, stdout: ''});
            expect(Judge.Check(r, '').result).toBe('RE');
        });
    });

    // CATEGORY 3: Timeout - Edge cases
    describe('Timeout', ()=>{
        it('should return TRE if signals is SIGKILL, regardless of exitCode', ()=>{
            const r = makeResult({exitCode: null, signal: 'SIGKILL'});
            expect(Judge.Check(r, 'anything').result).toBe('TLE');
        });

        it('Should return TRE if exitCode is 137, even if signal is null', ()=>{
            const r = makeResult({exitCode: 137, signal: null});
            expect(Judge.Check(r, 'anything').result).toBe('TLE');
        });

        it('Should return TRE if exitCode is 137, even if signal is SIGKTERM', ()=>{
            const r = makeResult({exitCode: 137, stdout: 'SIGKTERM'});
            expect(Judge.Check(r, 'anything').result).toBe('TLE');
        });
    });

    // Priority conflict cases
    describe('Priority when multiple conditions are met', ()=>{
        it('Should prioritize TLE over WA if both conditions are met', ()=>{
            const r = makeResult({exitCode: 137, stdout:'mismatched output'});
            expect(Judge.Check(r, 'expected').result).toBe('TLE');
        });
    });
});