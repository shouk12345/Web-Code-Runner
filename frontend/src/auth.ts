import { apiUrl } from "./api";

let apiKey : string| null = null;
let token : string | null = null;


export class AuthRequiredError extends Error {}

export function hasKey() : boolean {
    return apiKey !== null;
}

export function clearAuth() : void {
    apiKey = null;
    token = null;
}

async function exchange(key: string) : Promise<string> {
    const res = await fetch(apiUrl('/auth/token'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body:JSON.stringify({apiKey: key}),
    });
    if(res.status === 401) throw new AuthRequiredError('Invalid API key');
    if(res.status === 429) throw new Error('Too many attempts, try again shortly');
    if(!res.ok) throw new Error(`Token exchange faild (${res.status})`);
    return (await res.json()).token as string;
}

export async function login(key: string): Promise<void>{
    token = await exchange(key);
    apiKey = key;
}

export async function authFetch(path:string, init: RequestInit = {}) : Promise<Response> {
    if(!apiKey) throw new AuthRequiredError('Not logged in');

    const send = ()=>
        fetch(apiUrl(path),{
            ...init,
            headers:{...init.headers, Authorization: `Bearer ${token}`},
        });
    let res = await send();
    if(res.status === 401){
        try{
            token = await exchange(apiKey);
        } catch(e){
            clearAuth();
            throw e;
        }

        res = await send();
        if(res.status === 401){
            clearAuth();
            throw new AuthRequiredError('Session expired');
        }
    }
    return res;
}
