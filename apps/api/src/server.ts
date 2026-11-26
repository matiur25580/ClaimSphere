import {app} from "./app.js";
import {connectDatabase,disconnectDatabase} from "./config/database.js";
import {env} from "./config/env.js";
let server:ReturnType<typeof app.listen>|undefined;
async function start():Promise<void>{await connectDatabase();server=app.listen(env.API_PORT,()=>console.info(`ClaimSphere API listening on port ${env.API_PORT}`));}
async function shutdown(signal:string):Promise<void>{console.info(`${signal} received; shutting down gracefully.`);if(server)await new Promise<void>((resolve,reject)=>{server?.close(error=>error?reject(error):resolve());});await disconnectDatabase();process.exit(0);}
process.on("SIGINT",()=>void shutdown("SIGINT"));
process.on("SIGTERM",()=>void shutdown("SIGTERM"));
start().catch((error:unknown)=>{console.error("Unable to start ClaimSphere API:",error);process.exit(1);});
