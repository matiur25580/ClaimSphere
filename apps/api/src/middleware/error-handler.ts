import type {ErrorRequestHandler} from "express";
import {ZodError} from "zod";
import {env} from "../config/env.js";
export const errorHandler:ErrorRequestHandler=(error:unknown,_req,res,_next)=>{
 if(env.NODE_ENV!=="test")console.error(error);
 if(typeof error==="object"&&error!==null&&"code" in error&&error.code===11000){
  res.status(409).json({error:{code:"RESOURCE_CONFLICT",message:"A record with the supplied unique value already exists."}});return;
 }
 if(error instanceof ZodError){
  res.status(400).json({error:{code:"VALIDATION_ERROR",message:"The request contains invalid or unsupported fields.",issues:error.issues.map(issue=>({path:issue.path.join("."),message:issue.message}))}});return;
 }
 if(typeof error==="object"&&error!==null&&"name" in error&&error.name==="ValidationError"){
  res.status(400).json({error:{code:"MODEL_VALIDATION_ERROR",message:"The supplied data failed validation."}});return;
 }
 if(typeof error==="object"&&error!==null&&"status" in error&&"code" in error&&typeof error.status==="number"&&typeof error.code==="string"){
  const status=Math.min(599,Math.max(400,error.status));
  const message=env.NODE_ENV==="production"&&status>=500?"An unexpected error occurred.":error instanceof Error?error.message:"The request could not be completed.";
  res.status(status).json({error:{code:error.code,message}});return;
 }
 const message=error instanceof Error?error.message:"An unexpected error occurred.";
 res.status(500).json({error:{code:"INTERNAL_SERVER_ERROR",message:env.NODE_ENV==="production"?"An unexpected error occurred.":message}});
};