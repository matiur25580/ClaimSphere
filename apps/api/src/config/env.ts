import "dotenv/config";
import { z } from "zod";
const schema=z.object({NODE_ENV:z.enum(["development","test","production"]).default("development"),API_PORT:z.coerce.number().int().positive().default(4000),WEB_ORIGIN:z.string().url().default("http://localhost:5173"),MONGODB_URI:z.string().min(1).default("mongodb://127.0.0.1:27017/claimsphere"),LOG_LEVEL:z.enum(["fatal","error","warn","info","debug","trace","silent"]).default("info"),JWT_ACCESS_SECRET:z.string().min(32).default("development-only-change-this-secret-32-chars"),ACCESS_TOKEN_TTL:z.string().default("15m"),REFRESH_TOKEN_TTL_DAYS:z.coerce.number().int().min(1).max(90).default(30),BCRYPT_ROUNDS:z.coerce.number().int().min(10).max(14).default(12)});
const parsed=schema.safeParse(process.env);
if(!parsed.success){console.error("Invalid environment configuration:",parsed.error.flatten().fieldErrors);process.exit(1);}
if(parsed.data.NODE_ENV==="production"&&parsed.data.JWT_ACCESS_SECRET.startsWith("development-only")){console.error("JWT_ACCESS_SECRET must be configured in production.");process.exit(1);}
export const env=parsed.data;