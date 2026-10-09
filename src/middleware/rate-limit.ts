import {createMiddleware} from "hono/factory";
import type { FixedWindowRateLimiter } from "../domain/rate-limiter.js";
import type { AuthVariables } from "./jwt-auth.js";

function clientIp(xff: string | undefined): string {
    // ゲートウェイが加えた右端の値を信頼、左の値はクライアントから偽装可能であるため
    const last = xff?.split(',').pop()?.trim();
    return last || 'unknown';
}

function rateLimit(limiter: FixedWindowRateLimiter, keyOf: (c: any)=> string){
    return createMiddleware<{Variables: AuthVariables}>(async (c, next) =>{
        if(c.req.method === 'OPTIONS') return next();

        const decision = limiter.check(keyOf(c));
        if(!decision.allowed){
            c.header('Retry-After', String(decision.retryAfterSeconds));
            return c.json({error: 'Too many requests'}, 429);
        }
        await next();
    });
}

const byKeyId = (c: any) => `key:${c.get('keyId')}`;
const byIp = (c: any) => `ip:${clientIp(c.req.header('x-forwarded-for'))}`;

export { rateLimit, byKeyId, byIp, clientIp };