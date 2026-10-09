import { describe, it, expect } from 'vitest';
import { FixedWindowRateLimiter} from '../rate-limiter.js';
import { fi } from 'zod/locales';

describe('rate-limit', ()=>{
    it('allows up to the limit then rejects with retryAfter', ()=>{
        let t = 0;
        const rl = new FixedWindowRateLimiter(2, 1000, ()=>t);
        expect(rl.check('a').allowed).toBe(true);
        expect(rl.check('a').allowed).toBe(true);
        const third = rl.check('a');
        expect(third.allowed).toBe(false);
        if(!third.allowed) expect(third.retryAfterSeconds).toBe(1);
    });

    it('resets after the window passes', ()=>{
        let t = 0;
        const rl = new FixedWindowRateLimiter(1, 1000, ()=>t);
        rl.check('a');
        expect(rl.check('a').allowed).toBe(false);
        t = 1000;
        expect(rl.check('a').allowed).toBe(true);
    });

    it('counts keys independently', ()=>{
        const rl = new FixedWindowRateLimiter(1, 1000, ()=> 0);
        expect(rl.check('a').allowed).toBe(true);
        expect(rl.check('b').allowed).toBe(true);
    });

    it('forgets an exhausted bucket once it is evicted at the cap (known limitation)', ()=>{
        const rl = new FixedWindowRateLimiter(1,1000, ()=> 0, 2);
        rl.check('a');
        expect(rl.check('a').allowed).toBe(false);
        rl.check('b'); rl.check('c');
        expect(rl.check('a').allowed).toBe(true);
    })
})
