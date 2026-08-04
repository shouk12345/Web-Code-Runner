import {Hono} from 'hono';
import { serveStatic } from "@hono/node-server/serve-static";
import type {AppDependencies} from "./app-dependencies.js";
import {createSubmissionRoutes} from "./routes/submission.route.js";

function createApp(deps: AppDependencies): Hono {
    const app = new Hono();

    app.get("/", serveStatic({path: "./index.html"}));
    app.route('/submissions', createSubmissionRoutes(deps.codeJudge, deps.logger));
    
    return app;
}

export{createApp};