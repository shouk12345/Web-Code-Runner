// frontend/src/App.tsx
import { useState } from 'react';
import { LanguageSelect} from './components/LanguageSelect';
import { CodeEditor } from './components/CodeEditor';
import './App.css';
import { type TestCase, TestCaseList } from './components/TestCaseList';
import { ResultList, type JudgeResult } from './components/ResultList';

function App() {
  const [language, setLanguage] = useState('node');
  const [code, setCode] = useState('');
  const [cases, setCases] = useState<TestCase[]>([{stdin:'', stdout:''}]);
  const [results, setResults] = useState<JudgeResult[] | null>(null);
  
  return (
    <div className="app">
      <header>
        <h1>Code Runner</h1>
        <LanguageSelect value={language} onChange={setLanguage} />
      </header>

      <CodeEditor language={language} value={code} onChange={setCode} />
      <TestCaseList cases={cases} onChange={setCases} />
      <ResultList results={results} />
    </div>
  );
}

export default App;