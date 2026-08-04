import {mkdtemp, writeFile, rm} from 'fs/promises';
import {join} from 'path';
import {tmpdir} from 'os';
import type {ExecutionBackend, ExecutionSpec, ExecutionSession} from '../domain/execution-backend.js';
import {Sandbox} from './sandbox.js';
import {ProcessRunner} from './process-runner.js';
import type {Logger} from '../logging/logger.js';

class DockerExecutionBackend implements ExecutionBackend{
    constructor(private runner : ProcessRunner){}

    async openSession(spec: ExecutionSpec, logger : Logger): Promise<ExecutionSession>{
        const tempDir = await mkdtemp(join(tmpdir(), 'coderunner-'));
        const filePath = join(tempDir, 'code');

        try{
            await writeFile(filePath, spec.code, "utf-8");
            // セッション生成以降の削除責任はSandbox(ExecutionSession)に委譲する
            return await Sandbox.create(filePath, tempDir, spec, this.runner, logger);
        }catch(err){
            // writeFile段階などセッション生成以前に失敗する場合削除
            await rm(tempDir, {recursive: true, force: true});
            throw err;
        }
    }
}

export {DockerExecutionBackend};