import {serve, upgradeWebSocket} from '@hono/node-server'
import {Hono} from 'hono'
import {WebSocketServer} from 'ws'
import {serveStatic} from '@hono/node-server/serve-static'
import {spawn} from 'child_process'

const app = new Hono()

app.get('/', serveStatic({path:'./index.html'}));

app.get('/ws', 
  upgradeWebSocket(()=>{
    const child = spawn(process.platform === 'win32' ? 'cmd.exe' : 'sh')
    
    if (process.platform === 'win32') {
      child.stdin.write('chcp 65001\n')
    }

    return{
      onOpen(event, ws){
        console.log("client connected and child process started");

        child.stdout.on('data',(data)=>{
          ws.send(data.toString());
        })

        child.stderr.on('data', (data)=>{
          ws.send(`error : ${data.toString()}\n`);
        })

        child.on('close', (code)=>{
          console.log(`child process exited with code ${code}`);
          ws.close()
        })
      },
      onMessage(event, ws){
        const command = event.data as string;
        child.stdin.write(command + '\n');
      },
      onClose(){
        console.log('client connection closed - kill child process');
        child.kill();
      },
      onError(error){
        console.log("websocket error:");
        child.kill();
      }
    }
    
  })
);

const wss = new WebSocketServer({noServer: true});

const server = serve({
  fetch: app.fetch,
  port: 3000, 
  websocket: { server: wss },
}, (info) => {
  console.log(`\nServer is running on http://localhost:${info.port}\n`)
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