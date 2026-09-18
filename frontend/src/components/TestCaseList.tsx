type TestCase = {stdin: string; stdout: string};

type Props = {
    cases: TestCase[];
    onChange : (cases: TestCase[]) => void;
}

const MAX_CASES = 10;

function TestCaseList({cases, onChange} : Props){
    function updateCase(index: number, field: keyof TestCase, value: string){
        const next = cases.map((c,i) => (i === index ? {...c, [field]:value} : c));
        onChange(next);
    }

    function AddCase() {
        if(cases.length >= MAX_CASES) return;
        onChange([...cases, {stdin:'', stdout:''}]);
    }

    function removeCase(index : number){
        if(cases.length <= 1) return;
        onChange(cases.filter((_,i)=> i !== index));
    }

    return (
        <div className="testcase-list">
            {cases.map((c,i)=>(
                <div key={i} className='testcase-row'>
                    <span className='testcase-label'> Case {i + 1}</span>
                    <textarea
                        placeholder='stdin'
                        value={c.stdin}
                        onChange={(e)=>updateCase(i, 'stdin', e.target.value)}
                    />
                    <textarea
                        placeholder='stdout'
                        value={c.stdout}
                        onChange={(e)=>updateCase(i, 'stdout', e.target.value)}
                    />
                    <button type="button" onClick={()=>removeCase(i)} disabled={cases.length <= 1}>
                        delete
                    </button>
                </div>
            ))}
            <button type="button" onClick={()=>AddCase()} disabled={cases.length >= MAX_CASES}>
                + add case ({cases.length}/{MAX_CASES})
            </button>
        </div>
    )
}

export{TestCaseList, type TestCase}