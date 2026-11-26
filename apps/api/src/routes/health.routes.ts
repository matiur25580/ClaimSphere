import {Router} from "express";
import mongoose from "mongoose";
export const healthRouter=Router();
healthRouter.get("/",(_req,res)=>{const ready=mongoose.connection.readyState===1;res.status(ready?200:503).json({data:{status:ready?"ok":"degraded",service:"claimsphere-api",timestamp:new Date().toISOString(),dependencies:{mongodb:ready?"connected":"disconnected"}}});});
