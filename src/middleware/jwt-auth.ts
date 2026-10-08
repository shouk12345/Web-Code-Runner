import {createMiddleware} from "hono/factory";
import {Hono} from "hono";
import {verify} from "hono/jwt";


type AuthVariables = {keyId: string};

function jwtAuth(secret : string){
    return createMiddleware<{Variables: AuthVariables}>(async (c, next)=>{
        // CORS preflight requests should not require authentication
        if(c.req.method === "OPTIONS") return next();

        const match = c.req.header("Authorization")?.match(/^Bearer (.+)$/);
        if(!match) return c.json({error: "Unauthorized"}, 401);

        try {
            // set algorithm to HS256. verify will throw if exp is expired
            const payload = await verify(match[1], secret, 'HS256');
            if(typeof payload.keyId !== 'string'){
                return c.json({error: 'Unauthorized'}, 401);
            }
            c.set('keyId', payload.keyId);
        } catch {
            return c.json({error : 'Unauthorized'}, 401);
        }

        await next();
    });
}

function protectByDefault(app: Hono<any>, secret:string, publicPaths: Set<string>){
    const auth = jwtAuth(secret);
    app.use('*', (c, next)=>{
        if(c.req.method === 'OPTIONS' || publicPaths.has(c.req.path)) return next();
        return auth(c, next);
    });
}

export {jwtAuth, protectByDefault, type AuthVariables};