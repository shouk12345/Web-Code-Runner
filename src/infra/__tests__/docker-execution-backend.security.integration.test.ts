import {describe, it, expect} from 'vitest';
import {DockerExecutionBackend} from '../docker-execution-backend.js';
import {ProcessRunner} from '../process-runner.js';
import {nullLogger} from '../../logging/null-logger.js';

describe('DockerExecutionBackend security boundaries', async ()=>{
    it('Should kill fork bomb via --pids-limit', async ()=>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: `
                function bomb(){
                    require('child_process').spawn(process.execPath, ['-e','while(true'{}]);
                }
                for(let i = 0; i < 10000; i++){try{bomb();} catch(e){}}
                `,
                image: 'runner-node:latest',
                entrypoint:['node', '/sandbox/code.js'],
                limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.exitCode).not.toBe(0);
        } finally {
            await session.close();
        }
    }, 15_000);

    it('Should block filesystem write attempts due to --read-only', async() =>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: `
                try{
                    require('fs').writeFileSync('/etc/malicious','pwned');
                    console.log('WRITE_SUCCESSED');
                } catch(e){
                    console.log('WRITE_BLOCKED:' + e.code);
                }
                `,
                image: 'runner-node:latest',
                entrypoint:['node', '/sandbox/code.js'],
                limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.stdout).not.toContain('WRITE_SUCCESSED');
            expect(result.stdout).toContain('WRITE_BLOCKED');
        } finally {
            await session.close();
        }
    }, 15_000);

    it('Should block outbound network access due to --network none', async() =>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: `
                const req = require('http').get('http://93.184.216.34', () => {
                    console.log('NETWORK_SUCCEEDED');
                });
                req.on('error', (e) => console.log('NETWORK_BLOCKED:' + e.code));
                req.setTimeout(3000, () => { console.log('NETWORK_BLOCKED:TIMEOUT'); process.exit(0); });
                `,
                image: 'runner-node:latest',
                entrypoint:['node', '/sandbox/code.js'],
                limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.stdout).not.toContain('NETWORK_SUCCEEDED');
            expect(result.stdout).toContain('NETWORK_BLOCKED');
        } finally {
            await session.close();
        }
    }, 15_000);
    

    it('Should get OOM-killed when exceeding memory llimits', async() =>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: `
                const chunk = [];
                while(true){ chunks.push(buffer.alloc(50 * 1024 * 1024)); }
                `,
                image: 'runner-node:latest',
                entrypoint:['node', '/sandbox/code.js'],
                limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.exitCode).not.toBe(0);
        } finally {
            await session.close();
        }
    }, 15_000);

    it('Should ptrace attempts via seccomp profile', async() =>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: `
                try{
                    require('child_process').execSync('strace -p 1');
                    console.log('PTRACE_SUCCESSED');
                } catch(e){
                    console.log('PTRACE_BLOCKED_OR_UNAVAILABLE');
                }
                `,
                image: 'runner-node:latest',
                entrypoint:['node', '/sandbox/code.js'],
                limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
                seccompProfile: process.cwd()+'/src/infra/seccomp-profiles/node.json'
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.stdout).not.toContain('PTRACE_SUCCESSED');
        } finally {
            await session.close();
        }
    }, 15_000);

    it('Should handle multiple concurrent sessions without host instability', async() =>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));
        const CONCURRENCY = 5;

        const sessions = await Promise.all(
            Array.from({length: CONCURRENCY}, ()=>
                backend.openSession(
                    {
                        code:'console.log(1+1)',
                        image: 'runner-node:latest',
                        entrypoint:['node', '/sandbox/code.js'],
                        limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
                    },
                    nullLogger
                )
            )
        );

        try{
            const results = await Promise.all(sessions.map(s=>s.run('',5)));
            for(const result of results){
                expect(result.exitCode).toBe(0);
                expect(result.stdout.trim()).toBe('2');
            }
        } finally {
            await Promise.all(sessions.map(s=>s.close()));
        }
    }, 20_000);

    it('Should block privilleged operations due to --cap-drop ALL', async() =>{
        const backend = new DockerExecutionBackend(new ProcessRunner(nullLogger));

        const session = await backend.openSession(
            {
                code: `
                    try {
                        process.setgroups([0]);
                        console.log('CAP_SUCCEEDED');
                    }catch(e){
                        console.log('CAP_BLOCKED:'+e.code);
                    }
                `,
                image: 'runner-node:latest',
                entrypoint:['node', '/sandbox/code.js'],
                limits:{memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5},
            },
            nullLogger
        );

        try{
            const result = await session.run('', 5);
            expect(result.stdout).not.toContain('CAP_SUCCEEDED');
            expect(result.stdout).toContain('CAP_BLOCKED');
        } finally {
            await session.close();
        }
    }, 15_000);
})