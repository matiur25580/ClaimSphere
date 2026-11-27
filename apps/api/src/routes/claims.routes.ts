import {Router} from "express";
import {authenticate,requireRoles} from "../middleware/auth.middleware.js";
import {
 activatePolicy,addClaimEvidence,assignClaim,createClaim,createPolicy,getClaim,listClaims,listPolicies,
 reviewClaimEvidence,settleClaim,transitionClaim
} from "../services/claims.service.js";
import {
 assignClaimSchema,claimListSchema,claimTransitionSchema,createClaimSchema,createPolicySchema,
 evidenceReviewSchema,evidenceSchema,policyListSchema,settlementSchema
} from "./claims.schemas.js";

export const claimsRouter=Router();
claimsRouter.use(authenticate);

claimsRouter.get("/policies",requireRoles("organization_admin","claims_manager","claims_adjuster","fraud_investigator","finance_officer","auditor","policyholder"),async(req,res,next)=>{
 try{const filters=policyListSchema.parse(req.query);const data=await listPolicies(req.auth!.organizationId,req.auth!.userId,req.auth!.role,filters);res.json({data});}catch(error){next(error);}
});
claimsRouter.post("/policies",requireRoles("organization_admin","claims_manager"),async(req,res,next)=>{
 try{const input=createPolicySchema.parse(req.body);const policy=await createPolicy(req.auth!.organizationId,req.auth!.userId,input);res.status(201).json({data:{policy}});}catch(error){next(error);}
});
claimsRouter.post("/policies/:policyId/activate",requireRoles("organization_admin","claims_manager"),async(req,res,next)=>{
 try{const policy=await activatePolicy(req.auth!.organizationId,req.auth!.userId,String(req.params.policyId??""));res.json({data:{policy}});}catch(error){next(error);}
});

claimsRouter.get("/claims",requireRoles("organization_admin","claims_manager","claims_adjuster","fraud_investigator","finance_officer","auditor","policyholder"),async(req,res,next)=>{
 try{const filters=claimListSchema.parse(req.query);const data=await listClaims(req.auth!.organizationId,req.auth!.userId,req.auth!.role,filters);res.json({data});}catch(error){next(error);}
});
claimsRouter.post("/claims",requireRoles("organization_admin","claims_manager","claims_adjuster","policyholder"),async(req,res,next)=>{
 try{const input=createClaimSchema.parse(req.body);const data=await createClaim(req.auth!.organizationId,req.auth!.userId,req.auth!.role,input);res.status(201).json({data});}catch(error){next(error);}
});
claimsRouter.get("/claims/:claimId",requireRoles("organization_admin","claims_manager","claims_adjuster","fraud_investigator","finance_officer","auditor","policyholder"),async(req,res,next)=>{
 try{const data=await getClaim(req.auth!.organizationId,String(req.params.claimId??""),req.auth!.userId,req.auth!.role);res.json({data});}catch(error){next(error);}
});
claimsRouter.post("/claims/:claimId/transition",requireRoles("organization_admin","claims_manager","claims_adjuster","fraud_investigator","finance_officer"),async(req,res,next)=>{
 try{const input=claimTransitionSchema.parse(req.body);const data=await transitionClaim(req.auth!.organizationId,req.auth!.userId,req.auth!.role,String(req.params.claimId??""),input.toStatus,input.note);res.json({data});}catch(error){next(error);}
});
claimsRouter.post("/claims/:claimId/assign",requireRoles("organization_admin","claims_manager"),async(req,res,next)=>{
 try{const input=assignClaimSchema.parse(req.body);const data=await assignClaim(req.auth!.organizationId,req.auth!.userId,String(req.params.claimId??""),input.adjusterUserId);res.json({data});}catch(error){next(error);}
});
claimsRouter.post("/claims/:claimId/evidence",requireRoles("organization_admin","claims_manager","claims_adjuster","policyholder"),async(req,res,next)=>{
 try{const input=evidenceSchema.parse(req.body);const evidence=await addClaimEvidence(req.auth!.organizationId,req.auth!.userId,req.auth!.role,String(req.params.claimId??""),input);res.status(201).json({data:{evidence}});}catch(error){next(error);}
});
claimsRouter.patch("/claims/:claimId/evidence/:evidenceId/review",requireRoles("organization_admin","claims_manager","claims_adjuster"),async(req,res,next)=>{
 try{const input=evidenceReviewSchema.parse(req.body);const evidence=await reviewClaimEvidence(req.auth!.organizationId,req.auth!.userId,String(req.params.claimId??""),String(req.params.evidenceId??""),input.status,input.note);res.json({data:{evidence}});}catch(error){next(error);}
});
claimsRouter.post("/claims/:claimId/settle",requireRoles("organization_admin","finance_officer"),async(req,res,next)=>{
 try{const input=settlementSchema.parse(req.body);const data=await settleClaim(req.auth!.organizationId,req.auth!.userId,String(req.params.claimId??""),input.settlementAmountMinor,input.note);res.json({data});}catch(error){next(error);}
});
