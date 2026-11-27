import {createHash,randomBytes,randomUUID} from "node:crypto";
import jwt from "jsonwebtoken";
import {env} from "../config/env.js";
export interface AccessTokenPayload{sub:string;org:string;role:string;sid:string}
export const hashRefreshToken=(token:string)=>createHash("sha256").update(token).digest("hex");
export const createRefreshToken=(sessionId:string)=>sessionId+"."+randomBytes(48).toString("base64url");
export function parseRefreshToken(token:string):{sessionId:string}|null{const parts=token.split(".");if(parts.length!==2||!parts[0]||!parts[1]||!/^[a-f\d]{24}$/i.test(parts[0])||parts[1].length<40)return null;return{sessionId:parts[0]};}
export function signAccessToken(payload:AccessTokenPayload):string{const options:jwt.SignOptions={expiresIn:env.ACCESS_TOKEN_TTL as NonNullable<jwt.SignOptions["expiresIn"]>,issuer:"claimsphere-api",audience:"claimsphere-web"};return jwt.sign(payload,env.JWT_ACCESS_SECRET,options);}
export function verifyAccessToken(token:string):AccessTokenPayload{return jwt.verify(token,env.JWT_ACCESS_SECRET,{issuer:"claimsphere-api",audience:"claimsphere-web"}) as AccessTokenPayload;}
export const createSessionFamilyId=()=>randomUUID();