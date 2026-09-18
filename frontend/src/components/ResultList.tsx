type VerdictType = 'AC' | 'WA' | 'TLE' | 'RE';
type JudgeResult = { result: VerdictType; output: string };

const VERDICT_STYLE: Record<VerdictType, { label: string; color: string }> = {
  AC: { label: 'Accepted', color: '#7ee0c3' },
  WA: { label: 'Wrong Answer', color: '#ff8a8a' },
  TLE: { label: 'Time Limit Exceeded', color: '#ffb454' },
  RE: { label: 'Runtime Error', color: '#ff8a8a' },
};

type Props = {
  results: JudgeResult[] | null;
};

function ResultList({results}: Props){
    if(!results) return null;

    return (
        <div className="result-list">
            {results.map((r,i)=>{
                const style = VERDICT_STYLE[r.result];
                return (
                    <div key={i} className="result-row">
                        <span className="result-badge" style={{color: style.color}}>
                            Case {i + 1}: {r.result} - {style.label}
                        </span>
                        <pre className="result-output">{r.output}</pre>
                    </div>
                );
            })}
        </div>
    );
}

export {ResultList, type JudgeResult, type VerdictType};