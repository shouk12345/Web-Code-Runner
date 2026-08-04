import { describe, it, expect } from "vitest";
import { DockerExecutionBackend } from "../docker-execution-backend.js";
import { ProcessRunner } from "../process-runner.js";
import { nullLogger } from "../../logging/null-logger.js";

describe('DockerExecutionBackend', async ()=>{
    it('Should execute simple Node.js script in isolation and retrieve stdout.', async ()=>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: 'console.log("hello from sandbox")',
                image: 'runner-node:latest',
                entrypoint: ['node', '/sandbox/code.js'],
                limits: {memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toBe('hello from sandbox');
        } finally{
            await session.close();
        }
    }, 15_000); // set a generous timeout to account for container spawn time

    it('Should forcefully terminate infinite loop code via timeout to verify security hardening behavior', async ()=>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: 'while(true){}',
                image: 'runner-node:latest',
                entrypoint: ['node', '/sandbox/code.js'],
                limits: { memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 2 },
            },
            nullLogger
        );

        try{
            const result = await session.run('', 2);
            expect(result.exitCode).toBe(137); // Force shutdown by timeout -s KILL
        } finally{
            await session.close();
        }
    }, 15_000);
});
