import {Editor} from '@monaco-editor/react';

const MONACO_LANGUAGE_MAP : Record<string, string> = {
    node: 'javascript',
    python: 'python',
    cpp: 'cpp',
};

type Props = {
    language: string;
    value: string;
    onChange: (code: string) => void;
}

function CodeEditor({language, value, onChange}: Props){
    return (
        <Editor
            height="60vh"
            language={MONACO_LANGUAGE_MAP[language] ?? 'plaintext'}
            value={value}
            onChange={(v) => onChange(v ?? '')}
            theme='vs-dark'
            options={{
                minimap:{enabled: false},
                fontSize: 14,
                automaticLayout: true,
            }}
        />
    );
}

export {CodeEditor};