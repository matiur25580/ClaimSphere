import {z} from "zod";
const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const dateTime=z.string().datetime({offset:true});
export const createPolicySchema=z.object({
 policyNumber:z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
 policyholderUserId:objectId,
 productLine:z.enum(["auto","home","property","commercial","health","travel","other"]),
 insuredItem:z.string().trim().min(3).max(2000),
 coverageSummary:z.string().trim().min(10).max(3000),
 coverageLimitMinor:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
 deductibleMinor:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
 currency:z.string().regex(/^[A-Za-z]{3}$/).transform(v=>v.toUpperCase()),
 effectiveAt:dateTime,expiresAt:dateTime
}).strict().superRefine((v,ctx)=>{
 if(Date.parse(v.expiresAt)<=Date.parse(v.effectiveAt))ctx.addIssue({code:"custom",path:["expiresAt"],message:"Expiry must be after the effective date."});
 if(v.deductibleMinor>v.coverageLimitMinor)ctx.addIssue({code:"custom",path:["deductibleMinor"],message:"Deductible cannot exceed coverage limit."});
});
export const policyListSchema=z.object({
 status:z.enum(["draft","active","expired","cancelled"]).optional(),
 page:z.coerce.number().int().min(1).default(1),
 limit:z.coerce.number().int().min(1).max(100).default(25)
}).strict();
export const createClaimSchema=z.object({
 policyId:objectId,
 lossDate:dateTime,
 lossType:z.enum(["collision","theft","property_damage","water_damage","fire","medical","travel_disruption","liability","other"]),
 lossDescription:z.string().trim().min(10).max(5000),
 estimatedLossMinor:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
 severity:z.enum(["low","medium","high","critical"]).default("medium")
}).strict();
export const claimListSchema=z.object({
 status:z.enum(["submitted","triage","under_review","awaiting_documents","investigation","approved","rejected","settled","closed"]).optional(),
 severity:z.enum(["low","medium","high","critical"]).optional(),
 page:z.coerce.number().int().min(1).default(1),
 limit:z.coerce.number().int().min(1).max(100).default(25)
}).strict();
export const claimTransitionSchema=z.object({
 toStatus:z.enum(["triage","under_review","awaiting_documents","investigation","approved","rejected","closed"]),
 note:z.string().trim().max(2000).optional().default("")
}).strict().superRefine((v,ctx)=>{
 if(v.toStatus==="rejected"&&v.note.length<5)ctx.addIssue({code:"custom",path:["note"],message:"A rejection reason is required."});
});
export const assignClaimSchema=z.object({adjusterUserId:objectId}).strict();
export const evidenceSchema=z.object({
 fileName:z.string().trim().min(1).max(180),
 mimeType:z.enum(["application/pdf","image/jpeg","image/png","image/webp","text/plain"]),
 sizeBytes:z.number().int().min(1).max(25*1024*1024),
 sha256:z.string().regex(/^[a-f0-9]{64}$/i),
 storageRef:z.string().regex(/^[A-Za-z0-9_-]{12,180}$/),
 category:z.enum(["incident_photo","invoice","police_report","medical_document","repair_estimate","other"])
}).strict();
export const evidenceReviewSchema=z.object({
 status:z.enum(["accepted","rejected"]),
 note:z.string().trim().max(1000).optional().default("")
}).strict().superRefine((v,ctx)=>{
 if(v.status==="rejected"&&v.note.length<5)ctx.addIssue({code:"custom",path:["note"],message:"A reason is required to reject evidence."});
});
export const settlementSchema=z.object({
 settlementAmountMinor:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
 note:z.string().trim().min(5).max(2000)
}).strict();
