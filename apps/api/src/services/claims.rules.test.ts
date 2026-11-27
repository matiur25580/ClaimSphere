import {describe,expect,it} from "vitest";
import {canTransitionClaim,isEvidenceMetadataSafe,isLossCovered} from "./claims.rules.js";
describe("policy coverage rules",()=>{
 it("requires active policy and a loss date inside the effective window",()=>{
  expect(isLossCovered("active","2026-01-01","2026-12-31","2026-06-01")).toBe(true);
  expect(isLossCovered("active","2026-01-01","2026-12-31","2025-12-31")).toBe(false);
  expect(isLossCovered("draft","2026-01-01","2026-12-31","2026-06-01")).toBe(false);
 });
});
describe("claim lifecycle rules",()=>{
 it("allows only explicit workflow transitions",()=>{
  expect(canTransitionClaim("submitted","triage")).toBe(true);
  expect(canTransitionClaim("under_review","approved")).toBe(true);
  expect(canTransitionClaim("closed","investigation")).toBe(false);
  expect(canTransitionClaim("approved","rejected")).toBe(false);
 });
});
describe("evidence metadata safety",()=>{
 it("accepts bounded metadata with checksum and opaque storage reference",()=>{
  expect(isEvidenceMetadataSafe({sizeBytes:1024,sha256:"a".repeat(64),storageRef:"externalObject_123"})).toBe(true);
 });
 it("rejects unsafe size, checksum and path-like storage references",()=>{
  expect(isEvidenceMetadataSafe({sizeBytes:26*1024*1024,sha256:"a".repeat(64),storageRef:"externalObject_123"})).toBe(false);
  expect(isEvidenceMetadataSafe({sizeBytes:1024,sha256:"bad",storageRef:"externalObject_123"})).toBe(false);
  expect(isEvidenceMetadataSafe({sizeBytes:1024,sha256:"a".repeat(64),storageRef:"../../etc/passwd"})).toBe(false);
 });
});
