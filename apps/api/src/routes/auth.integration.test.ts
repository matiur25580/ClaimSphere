import mongoose from "mongoose";
import request from "supertest";
import {afterAll,beforeAll,beforeEach,describe,expect,it} from "vitest";
import type {Express} from "express";

let app:Express;
let agent:ReturnType<typeof request.agent>;
const registration={email:"claims.admin@example.com",password:"correct-horse-battery-42",firstName:"Alex",lastName:"Morgan",organizationName:"Northstar Assurance",organizationSlug:"northstar-assurance"};

beforeAll(async()=>{process.env.NODE_ENV="test";process.env.MONGODB_URI??="mongodb://127.0.0.1:27017/claimsphere_test";process.env.JWT_ACCESS_SECRET??="integration-test-secret-that-is-at-least-32-characters";({app}=await import("../app.js"));await mongoose.connect(process.env.MONGODB_URI);await Promise.all(Object.values(mongoose.connection.models).map(model=>model.init()));});
beforeEach(async()=>{await Promise.all(Object.values(mongoose.connection.collections).map(collection=>collection.deleteMany({})));agent=request.agent(app);});
afterAll(async()=>{await mongoose.disconnect();});

describe("authentication HTTP integration",()=>{
 it("registers an organization administrator and exposes only safe profile fields",async()=>{const response=await agent.post("/api/v1/auth/register").send(registration);expect(response.status).toBe(201);expect(response.body.data.user.email).toBe(registration.email);expect(response.body.data.role).toBe("organization_admin");expect(response.body.data.accessToken).toBeTruthy();expect(JSON.stringify(response.body)).not.toContain("passwordHash");const cookies=response.headers["set-cookie"] as unknown as string[];expect(cookies.some(value=>value.includes("HttpOnly")&&value.includes("claimsphere_refresh"))).toBe(true);const me=await agent.get("/api/v1/auth/me").set("Authorization",`Bearer ${response.body.data.accessToken}`);expect(me.status).toBe(200);expect(me.body.data.organization.slug).toBe("northstar-assurance");});
 it("rejects duplicate email registration without leaving a partial account",async()=>{await agent.post("/api/v1/auth/register").send(registration).expect(201);const duplicate=await agent.post("/api/v1/auth/register").send({...registration,organizationSlug:"another-organization"});expect(duplicate.status).toBe(409);});
 it("rejects invalid credentials without creating a session",async()=>{await agent.post("/api/v1/auth/register").send(registration).expect(201);const response=await request(app).post("/api/v1/auth/login").send({email:registration.email,password:"wrong-password"});expect(response.status).toBe(401);expect(response.body.error.code).toBe("INVALID_CREDENTIALS");});
 it("rotates refresh tokens and revokes the whole family when an old token is reused",async()=>{const created=await agent.post("/api/v1/auth/register").send(registration).expect(201);const originalCookies=created.headers["set-cookie"] as unknown as string[];const oldCookie=originalCookies.find(value=>value.startsWith("claimsphere_refresh="))!.split(";")[0]!;const rotated=await agent.post("/api/v1/auth/refresh").expect(200);const newAccessToken=rotated.body.data.accessToken;expect(newAccessToken).toBeTruthy();const reuse=await request(app).post("/api/v1/auth/refresh").set("Cookie",oldCookie);expect(reuse.status).toBe(401);expect(reuse.body.error.code).toBe("REFRESH_TOKEN_REUSE");const revoked=await request(app).get("/api/v1/auth/me").set("Authorization",`Bearer ${newAccessToken}`);expect(revoked.status).toBe(401);});
 it("revokes the active session on logout",async()=>{const created=await agent.post("/api/v1/auth/register").send(registration).expect(201);const token=created.body.data.accessToken;await agent.post("/api/v1/auth/logout").expect(204);const me=await request(app).get("/api/v1/auth/me").set("Authorization",`Bearer ${token}`);expect(me.status).toBe(401);});
});
