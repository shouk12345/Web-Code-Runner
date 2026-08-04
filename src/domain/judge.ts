type VerdictType = 'AC' | 'WA' | 'TLE' | 'RE';

interface RawExecResult{
    exitCode: number | null;
    signal: string | null;
    stdout: string;
    stderr: string;
}

interface JudgeResult{
    result: VerdictType;
    output: string;
}

class Judge{
    static Check(result: RawExecResult, expected: string): JudgeResult{
        //timeoutの判定は、signalがSIGKILL、またはexitCodeが137(128+SIGKILL)であらわれる
        const isTimeout = result.signal === 'SIGKILL' || result.exitCode === 137; // SIGKILL
        if(isTimeout){
            return {result: 'TLE', output: result.stdout};
        }
        if(result.exitCode !== 0){
            return {result: 'RE', output: result.stdout};
        }

        if(result.stdout.trim() !== expected.trim()){
            return {result: 'WA', output: result.stdout};
        }

        return {result: 'AC', output: result.stdout};
    }
}

export {Judge, type JudgeResult, type RawExecResult, type VerdictType};