import type {Logger} from "../logging/logger.js";
import {type ResourceLimits} from "./execution-policy.js";
import {type RawExecResult} from "./judge.js";

//Dockerコンテナ(もしくはその他の実行環境)の実行に必要な情報をまとめたインターフェース
interface ExecutionSpec{
    code: string;
    image: string;
    entrypoint: string[];
    limits: ResourceLimits;
    runtime?: string;
}

interface ExecutionSession{
    run(stdin: string, timeoutSec: number): Promise<RawExecResult>;
    close(): Promise<void>;
}

interface ExecutionBackend{
    openSession(spec: ExecutionSpec, logger : Logger): Promise<ExecutionSession>;
}

export {type ExecutionBackend, type ExecutionSpec, type ExecutionSession};