import {Schema,model} from "mongoose";
const policySchema=new Schema({
 organizationId:{type:Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
 policyNumber:{type:String,required:true,trim:true,uppercase:true,maxlength:64},
 policyholderUserId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},
 productLine:{type:String,enum:["auto","home","property","commercial","health","travel","other"],required:true},
 insuredItem:{type:String,required:true,trim:true,maxlength:2000},
 coverageSummary:{type:String,required:true,trim:true,maxlength:3000},
 coverageLimitMinor:{type:Number,required:true,min:0,max:Number.MAX_SAFE_INTEGER},
 deductibleMinor:{type:Number,required:true,min:0,max:Number.MAX_SAFE_INTEGER},
 currency:{type:String,required:true,uppercase:true,minlength:3,maxlength:3},
 effectiveAt:{type:Date,required:true},
 expiresAt:{type:Date,required:true},
 status:{type:String,enum:["draft","active","expired","cancelled"],default:"draft",index:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true,optimisticConcurrency:true});
policySchema.index({organizationId:1,policyNumber:1},{unique:true});
policySchema.index({organizationId:1,policyholderUserId:1,status:1,expiresAt:1});
export const Policy=model("Policy",policySchema);
