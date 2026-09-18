// frontend/src/App.tsx
import { useState } from 'react';
import { LanguageSelect} from './components/LanguageSelect';
import { CodeEditor } from './components/CodeEditor';
import './App.css';

function App() {
  const [language, setLanguage] = useState('node');
  const [code, setCode] = useState('');
  return (
    <div className="app">
      <header>
        <h1>Code Runner</h1>
        <LanguageSelect value={language} onChange={setLanguage} />
      </header>

      <CodeEditor language={language} value={code} onChange={setCode} />
      {/* M4.1.4: 인풋/아웃풋 패널이 여기 들어갈 자리 */}
    </div>
  );
}

export default App;