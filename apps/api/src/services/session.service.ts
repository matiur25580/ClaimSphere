import {Types} from "mongoose";
import {env} from "../config/env.js";
import {Session} from "../models/session.model.js";
import {createRefreshToken,createSessionFamilyId,hashRefreshToken,signAccessToken} from "../security/tokens.js";
interface Context{userId:Types.ObjectId;organizationId:Types.ObjectId;role:string;userAgent?:string;ipAddress?:string;familyId?:string}
export async function issueSession(context:Context){const id=new Types.ObjectId();const refreshToken=createRefreshToken(id.toString());const expiresAt=new Date(Date.now()+env.REFRESH_TOKEN_TTL_DAYS*86400000);await Session.create({_id:id,userId:context.userId,organizationId:context.organizationId,familyId:context.familyId??createSessionFamilyId(),tokenHash:hashRefreshToken(refreshToken),expiresAt,userAgent:context.userAgent?.slice(0,500),ipAddress:context.ipAddress?.slice(0,64)});return{refreshToken,refreshExpiresAt:expiresAt,accessToken:signAccessToken({sub:context.userId.toString(),org:context.organizationId.toString(),role:context.role,sid:id.toString()})};}
export const revokeSessionFamily=(familyId:string)=>Session.updateMany({familyId,revokedAt:null},{$set:{revokedAt:new Date()}});