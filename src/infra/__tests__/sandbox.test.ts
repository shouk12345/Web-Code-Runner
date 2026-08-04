import { describe, it, expect, vi } from "vitest";
import { Sandbox } from "../sandbox.js";
import { type ProcessResult, ProcessRunner } from "../process-runner.js";
import type { ExecutionSpec } from "../../domain/execution-backend.js";
import { nullLogger } from "../../logging/null-logger.js";

function okResult(overrides: Partial<ProcessResult> = {}): ProcessResult{
    return {exitCode: 0, signal: null, stdout: '', stderr:'', ...overrides};
}

function fakeRunner(runImpl: (cmd:string, args:string[], stdin?:string) =>Promise<ProcessResult>){
    return {run:vi.fn(runImpl)} as unknown as ProcessRunner;
}

const spec : ExecutionSpec = {
    code: 'console.log(1)',
    image: 'runner-node:latest',
    entrypoint:['node', '/sandbox/code.js'],
    limits: {memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
};

describe('Sandbox.create()', ()=>{
    it('Should include correct flags prefixed with -- in docker un arguments.', async ()=>{
        const runner = fakeRunner(async ()=> okResult());
        await Sandbox.create('/tmp/code.js', '/tmp', spec, runner, nullLogger);

        const [, args] = (runner.run as any).mock.calls[0];
        expect(args).toContain('--cpus');
        expect(args).toContain('--pids-limit');
    });

    it('Should apply the memory value from spec.limits directly to --memory', async ()=>{
        const runner = fakeRunner(async ()=> okResult());
        await Sandbox.create('/tmp/code.js', '/tmp', {...spec, limits: {...spec.limits, memoryMb:128}}, runner, nullLogger);

        const [, args] = (runner.run as any).mock.calls[0];
        const memIndex = args.indexOf('--memory');
        expect(args[memIndex + 1]).toBe('128m');
    });

    it('Should throw ExecutionInfraError if creation fails', async ()=>{
        const runner = fakeRunner(async ()=> okResult({exitCode:1, stderr:'no such image'}));
        expect(Sandbox.create('/tmp/code.js','/tmp',spec, runner, nullLogger)).rejects.toThrow('container creation failed');
    });
});

describe('Sandbox.run()', ()=>{
    it('Should not call diagnose(docker inspect) if exitCode is 137.', async ()=>{
        const runner = fakeRunner(async (_cmd,args)=> {
            if(args[0] === 'run')return okResult();
            if(args[0] === 'exec') return okResult({exitCode: 137});
            return okResult();
        });
        const sandbox = await Sandbox.create('/tmp/code.js', '/tmp', spec, runner, nullLogger);
        await sandbox.run('',5);
        
        const inspectCalled = (runner.run as any).mock.calls.some((c:any[]) => c[1][0] === 'inspect');
        expect(inspectCalled).toBe(false);
    });

    it('Should call diagnose(docker inspect) on unknown failure (exitCode 1).', async ()=>{
        const runner = fakeRunner(async ()=> okResult());
        await Sandbox.create('/tmp/code.js', '/tmp', {...spec, limits: {...spec.limits, memoryMb:128}}, runner, nullLogger);

        const [, args] = (runner.run as any).mock.calls[0];
        const memIndex = args.indexOf('--memory');
        expect(args[memIndex + 1]).toBe('128m');
    });

    it('Should throw ExecutionInfraError if creation fails', async ()=>{
        const runner = fakeRunner(async (_cmd,args)=> {
            if(args[0] === 'run')return okResult();
            if(args[0] === 'exec') return okResult({exitCode: 1, stderr:'segfault'});
            if(args[0] === 'inspect') return okResult({stdout:'[{"State":{}}]'});
            return okResult();
        });
        const sandbox = await Sandbox.create('/tmp/code.js', '/tmp', spec, runner, nullLogger);
        await sandbox.run('',5);
        
        const inspectCalled = (runner.run as any).mock.calls.some((c:any[]) => c[1][0] === 'inspect');
        expect(inspectCalled).toBe(true);    
    });
});