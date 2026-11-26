import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({NODE_ENV:z.enum(["development","test","production"]).default("development"),API_PORT:z.coerce.number().int().positive().default(4000),WEB_ORIGIN:z.string().url().default("http://localhost:5173"),MONGODB_URI:z.string().min(1).default("mongodb://127.0.0.1:27017/claimsphere"),LOG_LEVEL:z.enum(["fatal","error","warn","info","debug","trace","silent"]).default("info")});
const parsed=envSchema.safeParse(process.env);
if(!parsed.success){console.error("Invalid environment configuration:",parsed.error.flatten().fieldErrors);process.exit(1);}
export const env=parsed.data;
