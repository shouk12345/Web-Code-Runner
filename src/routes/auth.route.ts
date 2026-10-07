import {Hono} from 'hono';
import {sign} from 'hono/jwt';
import {z} from 'zod';
import type {AuthStore} from '../domain/auth-store.js';
import {hashApiKey} from '../domain/api-key.js';

const TokenRequestSchema = z.object({
    apiKey: z.string().min(1).max(200),
});

type AuthRouteDeps = {
    authStore: AuthStore;
    jwtSecret: string;
    tokenTtlSeconds: number;
};

function createAuthRoute(deps: AuthRouteDeps): Hono{
    const routes = new Hono();

    routes.post('/token', async (c)=>{
        const parsed = TokenRequestSchema.safeParse(await c.req.json().catch(()=>null));
        if(!parsed.success) return c.json({error: 'Invalid request'}, 400);

        const record = await deps.authStore.findByKeyHash(hashApiKey(parsed.data.apiKey));
        if(!record) return c.json({error: 'Invalid API key'}, 401);

        const exp = Math.floor(Date.now() / 1000) + deps.tokenTtlSeconds;
        const token = await sign({keyId: record.keyId, exp}, deps.jwtSecret, 'HS256');
        return c.json({token, expiresIn: deps.tokenTtlSeconds});
    });

    return routes;
}

export {createAuthRoute};
