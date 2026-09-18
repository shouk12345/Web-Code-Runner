import {useEffect, useState} from "react";

type Language = {id : string, label: string};

type Props = {
    value: string;
    onChange: (id: string) => void;
}

function LanguageSelect({value, onChange}: Props){
    const [languages, setLanguages] = useState<Language[]>([]);
    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

    useEffect(()=>{
        fetch('/languages')
        .then((res)=>{
            if(!res.ok) throw new Error(`Status ${res.status}`);
            return res.json();
        })
        .then((data: Language[]) =>{
            setLanguages(data);
            setStatus('ready');
        })
        .catch(()=> setStatus('error'));
    }, []);

    if(status === 'loading') return <span> Loading languages...</span>
    if(status === 'error') return <span> Failed to load languages</span>
    
    return (
        <select value={value} onChange={(e)=> onChange(e.target.value)}>
            {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}

export {LanguageSelect};