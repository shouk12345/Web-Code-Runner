import { serve } from '@hono/node-server';
import { createApp } from "./app.js";
import type { AppDependencies } from './app-dependencies.js';
import {ConsoleLogger, type LogLevel} from './logging/logger.js'
import {ProcessRunner} from './infra/process-runner.js'
import  { DockerExecutionBackend } from './infra/docker-execution-backend.js';
import { CodeJudge } from './domain/code-judge.js';
import { InMemoryAuthStore } from './infra/in-memory-auth-store.js';

const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const rootLogger = new ConsoleLogger({},logLevel);

const processRunner = new ProcessRunner(rootLogger);
const executionBackend = new DockerExecutionBackend(processRunner);
const codeJudge = new CodeJudge(executionBackend, rootLogger);

const jwtSecret = process.env.JWT_SECRET;
if(!jwtSecret || jwtSecret.length < 32){
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}

// ----for local development
const seeded = JSON.parse(process.env.AUTH_RECORDS ?? '[]');
const authStore = new InMemoryAuthStore(seeded);
//--------------------------

const deps : AppDependencies = {
    codeJudge,
    logger: rootLogger,
    authStore,
    jwtSecret
};

const app = createApp(deps);

const server = serve({fetch: app.fetch, port: 3000}, (info)=>{
    console.log(`\nServer is running on http://localhost:${info.port}\n`);
});
process.on('SIGINT', ()=>{
  server.close()
  process.exit(0)
})

process.on('SIGTERM', ()=>{
  server.close((err)=>{
    if(err){
      console.log(err)
      process.exit(1)
    }
    process.exit(0)
  })
})