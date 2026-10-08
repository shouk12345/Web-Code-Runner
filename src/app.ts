import {Hono} from 'hono';
import type {AppDependencies} from "./app-dependencies.js";
import {createSubmissionRoutes} from "./routes/submission.route.js";
import {languageRoute} from "./routes/language.route.js";
import {createAuthRoute} from "./routes/auth.route.js";
import {protectByDefault} from "./middleware/jwt-auth.js";

function createApp(deps: AppDependencies): Hono {
    const app = new Hono();
    const PUBLIC_PATHS = new Set(['/auth/token', '/languages']);

    protectByDefault(app, deps.jwtSecret, PUBLIC_PATHS);

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