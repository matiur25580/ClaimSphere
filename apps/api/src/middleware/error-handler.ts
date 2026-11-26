import type {ErrorRequestHandler} from "express";
import {env} from "../config/env.js";
export const errorHandler:ErrorRequestHandler=(error:unknown,_req,res,_next)=>{const message=error instanceof Error?error.message:"An unexpected error occurred.";if(env.NODE_ENV!=="test")console.error(error);res.status(500).json({error:{code:"INTERNAL_SERVER_ERROR",message:env.NODE_ENV==="production"?"An unexpected error occurred.":message}});};
