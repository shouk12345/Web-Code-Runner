// frontend/src/App.tsx
import { useState } from 'react';
import { LanguageSelect} from './components/LanguageSelect';
import { CodeEditor } from './components/CodeEditor';
import './App.css';
import { type TestCase, TestCaseList } from './components/TestCaseList';
import { ResultList, type JudgeResult } from './components/ResultList';
import { apiUrl } from './api';

function App() {
  const [language, setLanguage] = useState('node');
  const [code, setCode] = useState('');
  const [cases, setCases] = useState<TestCase[]>([{stdin:'', stdout:''}]);
  const [results, setResults] = useState<JudgeResult[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  async function handleRun(){
    setStatus('running');
    setErrorMessage(null);
    setResults(null);

    try{
      const res = await fetch(apiUrl('/submissions'),{
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({code, cases, language}),
      });

      if(!res.ok){
        throw new Error(`server error (status ${res.status})`);
      }

      const data = await res.json();
      setResults(data.ret);
      setStatus('idle');
    } catch(err){
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'unknown error');
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Code Runner</h1>
        <LanguageSelect value={language} onChange={setLanguage} />
      </header>

      <CodeEditor language={language} value={code} onChange={setCode} />
      <TestCaseList cases={cases} onChange={setCases} />

      <button onClick={handleRun} disabled={status==='running'}>
        {status === 'running' ? 'running...' : 'run'}
      </button>

      {status === 'error' && <p className='error-message'>{errorMessage}</p>}

      <ResultList results={results} />
    </div>
  );
}

export default App;