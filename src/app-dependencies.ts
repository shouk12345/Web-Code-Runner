
import {CodeJudge} from "./domain/code-judge.js";
import type {Logger} from "./logging/logger.js"

interface AppDependencies {
    codeJudge: CodeJudge;
    logger: Logger;
}

export {type AppDependencies};