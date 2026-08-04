class ValidationError extends Error {
    constructor(message: string, public readonly issues?: unknown){
        super(message);
        this.name = 'ValidationError';
    }
}

class ExecutionInfraError extends Error {
    constructor(
        message: string, 
        public readonly details: {
            containerName?: string;
            exitCode?: number | null;
            signal?: string | null;
            stderr?: string;
        } = {},

    ){
        super(message);
        this.name = 'ExecutionInfraError';
    }
}

export {ValidationError, ExecutionInfraError};