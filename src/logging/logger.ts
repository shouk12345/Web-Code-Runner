type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
    [key : string] : unknown;
}

interface Logger {
    debug(event: string, fields?: LogFields): void;
    info(event: string, fields?: LogFields): void;
    warn(event: string, fields?: LogFields): void;
    error(event: string, fields?: LogFields): void;
    child(context: LogFields): Logger;
}

const LEVEL_ORDER : LogLevel[] = ['debug', 'info', 'warn', 'error'];

class ConsoleLogger implements Logger{
    constructor(private context : LogFields = {}, private level : LogLevel = 'info'){}

    private log(level: LogLevel, event: string, fields?:LogFields){
        if(LEVEL_ORDER.indexOf(level) < LEVEL_ORDER.indexOf(this.level)) return;

        const entry = {
            timeStamp: new Date().toISOString(),
            level,
            event,
            ...this.context,
            ...fields,
        };

        const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        method(JSON.stringify(entry));
    }

    debug(event:string, fields?:LogFields){
        this.log('debug', event, fields);
    }

    info(event:string, fields?:LogFields){
        this.log('info', event, fields);
    }
    
    warn(event:string, fields?:LogFields){
        this.log('warn', event, fields);
    }

    error(event:string, fields?:LogFields){
        this.log('error', event, fields);
    }

    child(context: LogFields) : Logger{
        return new ConsoleLogger({...this.context, ...context}, this.level);
    }
}

export{type Logger, type LogFields, type LogLevel, ConsoleLogger};