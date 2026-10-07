
import {CodeJudge} from "./domain/code-judge.js";
import type {Logger} from "./logging/logger.js";
import type {AuthStore} from "./domain/auth-store.js";

interface AppDependencies {
    codeJudge: CodeJudge;
    logger: Logger;
    authStore: AuthStore;
    jwtSecret: string;
}

export {type AppDependencies};