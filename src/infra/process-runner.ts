import {spawn} from 'child_process';
import type {Logger} from "../logging/logger.js"

interface ProcessResult{
    exitCode: number | null;
    signal: string | null;
    stdout: string;
    stderr: string;
}

class ProcessRunner{
    constructor(private logger: Logger){}

    run(cmd: string, args: string[], stdin?: string): Promise<ProcessResult>{
        const startedAt = Date.now();
        const commandStr = `${cmd} ${args.join(' ')}`;

        this.logger.debug('process_spawn', {command: commandStr});

        return new Promise((resolve)=>{
            const child = spawn(cmd, args);
            const out : Buffer[] = [];
            const err : Buffer[] = [];

            child.stdout?.on('data', (d)=>out.push(d));
            child.stderr?.on('data', (d)=>err.push(d));
            
            if(stdin!==undefined){
                child.stdin?.write(stdin);
            }
            child.stdin?.end();

            child.on('close', (exitCode, signal)=>{
                const stdout = Buffer.concat(out).toString('utf-8').trim();
                const stderr = Buffer.concat(err).toString('utf-8').trim();
                const durationMs = Date.now() - startedAt;

                this.logger.debug('process_close', {command: commandStr, exitCode, signal, durationMs});

                if(exitCode!== 0){
                    this.logger.warn('process_failed', {command: commandStr, exitCode, signal, stderr, durationMs});
                }

                resolve({exitCode, signal, stdout, stderr});
            });

            child.on('error', (e)=>{
                this.logger.error('process_spawn_error', {command: commandStr, message: e.message});
                resolve({exitCode: null, signal: null, stdout: '', stderr: `spawn error: ${e.message}`});
            });
        });
    }
}

export{type ProcessResult, ProcessRunner};