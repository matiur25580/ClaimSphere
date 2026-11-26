import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttpModule from "pino-http";
import {env} from "./config/env.js";
import {errorHandler} from "./middleware/error-handler.js";
import {notFoundHandler} from "./middleware/not-found.js";
import {healthRouter} from "./routes/health.routes.js";

// pino-http ships a CommonJS runtime with an ESM-style default declaration.
// NodeNext models the declaration as a module namespace, while Node exposes
// module.exports as the ESM default. This cast keeps the runtime import intact.
const pinoHttp = pinoHttpModule as unknown as typeof pinoHttpModule.default;

export const app=express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({origin:env.WEB_ORIGIN,credentials:true,methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"]}));
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:false,limit:"1mb"}));
app.use(pinoHttp({level:env.LOG_LEVEL}));
app.get("/api/v1",(_req,res)=>res.json({data:{name:"ClaimSphere API",version:"v1",status:"operational"}}));
app.use("/api/v1/health",healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);
