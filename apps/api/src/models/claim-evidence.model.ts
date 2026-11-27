import {Schema,model} from "mongoose";
const claimEvidenceSchema=new Schema({
 organizationId:{type:Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
 claimId:{type:Schema.Types.ObjectId,ref:"Claim",required:true,index:true},
 fileName:{type:String,required:true,trim:true,maxlength:180},
 mimeType:{type:String,required:true,enum:["application/pdf","image/jpeg","image/png","image/webp","text/plain"]},
 sizeBytes:{type:Number,required:true,min:1,max:26214400},
 sha256:{type:String,required:true,match:/^[a-f0-9]{64}$/i},
 storageRef:{type:String,required:true,trim:true,minlength:12,maxlength:180},
 category:{type:String,enum:["incident_photo","invoice","police_report","medical_document","repair_estimate","other"],required:true},
 status:{type:String,enum:["pending_review","accepted","rejected"],default:"pending_review"},
 uploadedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 reviewedBy:{type:Schema.Types.ObjectId,ref:"User",default:null},
 reviewedAt:{type:Date,default:null},
 reviewNote:{type:String,trim:true,maxlength:1000,default:""}
},{timestamps:true});
claimEvidenceSchema.index({organizationId:1,claimId:1,createdAt:-1});
claimEvidenceSchema.index({organizationId:1,storageRef:1},{unique:true});
export const ClaimEvidence=model("ClaimEvidence",claimEvidenceSchema);
