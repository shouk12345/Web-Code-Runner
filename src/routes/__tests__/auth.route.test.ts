import {describe, it, expect} from 'vitest';
import {Hono} from 'hono';
import { verify } from 'hono/jwt';
import { createAuthRoute } from '../auth.route.js';
import { InMemoryAuthStore } from '../../infra/in-memory-auth-store.js';
import { hashApiKey } from '../../domain/api-key.js';

const SECRET = 'x'.repeat(32);
const KEY = 'test-key';

function makeApp() {
    const store = new InMemoryAuthStore([{ keyId: 'test', keyHash: hashApiKey(KEY) }]);
    return new Hono().route('/auth', createAuthRoute({authStore: store, jwtSecret: SECRET, tokenTtlSeconds: 3600}));
}

const post = (app: Hono, body:unknown) => 
    app.request('/auth/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });

describe('POST /auth/token', ()=>{
    it('correct key returns a usable token', async ()=>{
        const res = await post(makeApp(), {apiKey: KEY});
        expect(res.status).toBe(200);
        const {token} = await res.json();
        const payload = await verify(token, SECRET, 'HS256');
        expect(payload.keyId).toBe('test');
    });

    it('incorrect key returns 401', async ()=>{
        expect((await post(makeApp(), {apiKey: 'wrong'})).status).toBe(401);
    });

    it('missing key returns 400', async ()=>{
        expect((await post(makeApp(), {})).status).toBe(400);
        expect((await post(makeApp(), 'not json')).status).toBe(400);
    });
});