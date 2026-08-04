import type { Logger, LogFields } from "./logger.js";

class NullLogger implements Logger{
    debug(event: string, fields?: LogFields): void {}
    info(event: string, fields?: LogFields): void {}
    warn(event: string, fields?: LogFields): void {}
    error(event: string, fields?: LogFields): void {}
    child(context: LogFields): Logger {
        return this;
    }
}

const nullLogger : Logger = new NullLogger();

export{NullLogger, nullLogger};