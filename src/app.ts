import {Hono} from 'hono';
import type {AppDependencies} from "./app-dependencies.js";
import {createSubmissionRoutes} from "./routes/submission.route.js";
import {languageRoute} from "./routes/language.route.js";

function createApp(deps: AppDependencies): Hono {
    const app = new Hono();

    app.options('*', (c) => c.body(null, 204));
    app.route('/submissions', createSubmissionRoutes(deps.codeJudge, deps.logger));
    app.route('/languages', languageRoute);

    return app;
}

export{createApp};