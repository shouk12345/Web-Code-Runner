import {rm} from 'fs/promises';
import {ProcessRunner, type ProcessResult} from './process-runner.js'
import type {Logger} from '../logging/logger.js'
import { ExecutionInfraError } from '../errors.js';
import type {ExecutionSpec, ExecutionSession} from '../domain/execution-backend.js'

function toDockerPath(winPath: string): string{
    if (!/^[A-Za-z]:\\/.test(winPath)) return winPath; // すでにPOSIX経路ならそのままにする
    return winPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `//${drive.toLowerCase()}`);
}

function extensionFor(entrypoint : string[]) : string {
    if(entrypoint[0] === "node") return '.js';
    if(entrypoint[0] === "python") return '.py';
    return '.cpp';
}

class Sandbox implements ExecutionSession {
    private constructor(
        private containerName : string,
        private entrypoint : string[],
        private runner : ProcessRunner,
        private logger : Logger,
        private tempDir: string
    ){}

    static async create(
        codePath: string,
        tempDir: string,
        spec: ExecutionSpec,
        runner: ProcessRunner,
        logger: Logger
    ): Promise<Sandbox> {
        const containerName = `runner-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const sandboxLogger = logger.child({containerName});
        const mountPath = toDockerPath(codePath);
        const {memoryMb, cpus, pidsLimit} = spec.limits;

        sandboxLogger.debug('sanbox_create_start', {image: spec.image, mountPath});

        const result = await runner.run('docker',[
            'run', '-d', '--rm', '--name', containerName,
            '--network', 'none',
            '--read-only',
            '--tmpfs', '/tmp:rw,size=32m,noexec',
            '--memory', `${memoryMb}m`,
            '--cpus', `${cpus}`,
            '--pids-limit', `${pidsLimit}`,
            '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges',
            '-v', `${mountPath}:/sandbox/code${extensionFor(spec.entrypoint)}:ro`,
            spec.image,
            'sleep', 'infinity',
        ]);

        if(result.exitCode !== 0){
            sandboxLogger.error('sandbox_create_failed', {exitcode: result.exitCode, stderr: result.stderr});
            await rm(tempDir, {recursive: true, force: true});
            throw new ExecutionInfraError('container creation failed',{
                containerName,
                exitCode: result.exitCode,
                stderr: result.stderr,
            });
        }

        sandboxLogger.info('sanbox_created', {});
        return new Sandbox(containerName, spec.entrypoint, runner, sandboxLogger, tempDir);
    }

    async run(stdin: string, timeoutSec: number) : Promise<ProcessResult>{
        const result = await this.runner.run(
            'docker',
            ['exec', '-i', this.containerName, 'timeout', '-s', 'KILL', `${timeoutSec}`, ...this.entrypoint],
            stdin
        );

        const isTimeout = result.exitCode === 137;
        if(result.exitCode !== 0 && !isTimeout){
            await this.diagnose();
        }

        return result;
    }

    private async diagnose() : Promise<void>{
        const inspect = await this.runner.run('docker',['inspect', this.containerName]);
        if(inspect.exitCode !== 0){
            this.logger.warn('sanbox_diagnose_inspect_failed', {stderr: inspect.stderr});
            return;
        }

        try{
            const info = JSON.parse(inspect.stdout)[0];
            this.logger.warn('sanbox_diagnose',{
                oomKilled: info.State?.OOMKilled,
                state: info.State?.Status,
                mounts: info.Mounts?.map((m:{Source: string; Destination: string})=>`${m.Source}->${m.Destination}`),
            });
        } catch {
            this.logger.warn('sandbox_diagnose_parse_failed', {raw: inspect.stdout});
        }
    }

    async close(): Promise<void>{
        const result = await this.runner.run('docker', ['rm', '-f', this.containerName]);
        if(result.exitCode !== 0){
            // destroy失敗はロジックに影響ないためThrowはしない、ゾンビコンテナ感知のためのWan登録
            this.logger.warn('sanbox_destroy_failed', {stderr: result.stderr});
        }else{
            this.logger.debug('sanbox_destroyed',{});
        }
        await rm(this.tempDir, {recursive: true, force: true});
    }
}

export {Sandbox, toDockerPath};