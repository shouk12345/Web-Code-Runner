import {describe, it, expect} from "vitest";
import {Hono} from "hono";
import { sign } from "hono/jwt";
import {type AuthVariables ,protectByDefault} from "../jwt-auth.js";
import { createApp } from "../../app.js";
import { type Logger } from "../../logging/logger.js"; 
import { InMemoryAuthStore } from "../../infra/in-memory-auth-store.js";
import { CodeJudge } from '../../domain/code-judge.js';
import { generateApiKey, hashApiKey } from "../../domain/api-key.js";

const SECRET = 'x'.repeat(32);

const makeToken = (exp=Math.floor(Date.now() / 1000) + 600, secret = SECRET)=>
    sign({keyId: 'dev', exp}, secret, 'HS256');

function makeApp() {
    const app = new Hono<{Variables: AuthVariables}>();
    protectByDefault(app, SECRET, new Set(['/auth/token', '/languages']));
    app.options('*', (c) => c.body(null, 204));
    app.post('/submissions', (c) => c.json({ keyId: c.get('keyId') }));
    app.post('/auth/token', (c) => c.json({ ok: true }));
    app.get('/languages', (c) => c.json(['node']));
    app.get('/new-route', (c) => c.json({ secret: true })); // 後に追加されるラウト帯域
    return app;
}

const call = (path: string, init: RequestInit = {}) => makeApp().request(path, {method: 'POST', ...init});
const bearer = (t: string) => ({headers: {Authorization: `Bearer ${t}`}});

describe('protectByDefault', ()=>{
    it('passes a valid token through and exposes keyId', async ()=>{
        const res = await call('/submissions', bearer(await makeToken()));
        expect(res.status).toBe(200);
        expect((await res.json()).keyId).toBe('dev');
    });

    it('returns 401 when the Authorization header is missing', async () => {
        expect((await call('/submissions')).status).toBe(401);
    });

    it('returns 401 when the header is not a Bearer token', async () => {
        const res = await call('/submissions', { headers: { Authorization: 'Basic abc' } });
        expect(res.status).toBe(401);
    });

    it('returns 401 for a token signed with a different secret', async () => {
        const forged = await makeToken(undefined, 'y'.repeat(32));
        expect((await call('/submissions', bearer(forged))).status).toBe(401);
    });

    it('returns 401 for an expired token', async () => {
        const expired = await makeToken(Math.floor(Date.now() / 1000) - 10);
        expect((await call('/submissions', bearer(expired))).status).toBe(401);
    });

    it('lets OPTIONS through without a token (204)', async () => {
        expect((await call('/submissions', { method: 'OPTIONS' })).status).toBe(204);
    });

    it('keeps /languages open without a token', async () => {
        expect((await call('/languages', { method: 'GET' })).status).toBe(200);
    });

    it('keeps /auth/token open without a token', async () => {
        expect((await call('/auth/token')).status).toBe(200);
    });

    it('returns 401 for a route not in the public list (new routes are protected by default)', async () => {
        expect((await call('/new-route', { method: 'GET' })).status).toBe(401);
    });

    it('returns 401 for a nonexistent path without a token', async () => {
        expect((await call('/nope', { method: 'GET' })).status).toBe(401);
    });

    it('createApp protects /submissions without a token', async () => {
        const codeJudge = {} as unknown as CodeJudge;
        const logger = { info() {}, warn() {}, error() {}, debug() {} } as unknown as Logger;
        const app = createApp({
            codeJudge,
            logger,
            authStore: new InMemoryAuthStore(),
            jwtSecret: SECRET,
        });
        const res = await app.request('/submissions', { method: 'POST' });
        expect(res.status).toBe(401);
    });

    it('exchanges an API for a token and passes the auth middleware', async ()=>{
        const apiKey = generateApiKey();
        const authStore = new InMemoryAuthStore([{keyId:'dev', keyHash:hashApiKey(apiKey)}]);

        const codeJudge = {} as unknown as CodeJudge;
        const logger = {info(){}, warn(){}, error(){}, debug(){}, child(){return logger;}} as unknown as Logger;
        const app = createApp({codeJudge, logger, authStore, jwtSecret:SECRET});

        const tokenRes = await app.request('/auth/token', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({apiKey}),
        });
        expect(tokenRes.status).toBe(200);
        const {token} = await tokenRes.json();

        const res = await app.request('/submissions', {
            method:'POST',
            headers:{Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
    });
    
})