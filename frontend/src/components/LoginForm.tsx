import { useState } from "react";
import { login } from "../auth";

type Props = {
    onLoggedIn: ()=> void;
    notice?: string | null;
};

export function LoginForm({onLoggedIn, notice}: Props){
    const [key, setKey] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string|null>(null);
    
    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        if(!key.trim()) return;
        setBusy(true);
        setError(null);
        try{
            await login(key.trim());
            setKey('');
            onLoggedIn();
        }catch(err){
            setError(err instanceof Error ? err.message: 'unknown error');
        }finally {
            setBusy(false);
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <h1>Code Runner</h1>
            <p>Enter your API key to continue.</p>
            {notice && <p className="notice">{notice}</p>}
            <input
                type="password"
                value={key}
                onChange={(e)=> setKey(e.target.value)}
                placeholder="API key"
                autoComplete="off"
                disabled={busy}
            />
            <button type="submit" disabled={busy || !key.trim()}>
                {busy ? 'checking...' : 'continue'}
            </button>
            {error && <p className="error-message">{error}</p>} 
        </form>
    );
}