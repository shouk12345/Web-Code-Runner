import {Hono} from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type {AppDependencies} from "./app-dependencies.js";
import {createSubmissionRoutes} from "./routes/submission.route.js";
import {languageRoute} from "./routes/language.route.js";
import {createAuthRoute} from "./routes/auth.route.js";
import {protectByDefault} from "./middleware/jwt-auth.js";
import { byIp, byKeyId, rateLimit } from './middleware/rate-limit.js';
import { FixedWindowRateLimiter } from './domain/rate-limiter.js';

function createApp(deps: AppDependencies): Hono {
    const app = new Hono();
    const PUBLIC_PATHS = new Set(['/auth/token', '/languages']);
    const submissionLimiter = new FixedWindowRateLimiter(10, 60_000);
    const tokenLimiter = new FixedWindowRateLimiter(10, 60_000);

    app.use('*', bodyLimit({
        maxSize: 256 * 1024,
        onError: (c)=> c.json({error: 'Payload too large'}, 413),
    }));

    protectByDefault(app, deps.jwtSecret, PUBLIC_PATHS);
    app.use('/submissions/*', rateLimit(submissionLimiter, byKeyId));
    app.use('/auth/token', rateLimit(tokenLimiter, byIp)); // トークン交換はIP別制限


    app.options('*', (c) => c.body(null, 204));
    app.route('/submissions', createSubmissionRoutes(deps.codeJudge, deps.logger));
    app.route('/auth', createAuthRoute({
        authStore: deps.authStore,
        jwtSecret: deps.jwtSecret,
        tokenTtlSeconds: 3600,
    }));
    app.route('/languages', languageRoute);

    return app;
}

export{createApp};