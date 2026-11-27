import {Schema,model} from "mongoose";
const claimSchema=new Schema({
 organizationId:{type:Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
 claimNumber:{type:String,required:true,trim:true,uppercase:true,maxlength:64},
 policyId:{type:Schema.Types.ObjectId,ref:"Policy",required:true,index:true},
 policyholderUserId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},
 lossDate:{type:Date,required:true,index:true},
 reportedAt:{type:Date,required:true,default:Date.now},
 lossType:{type:String,enum:["collision","theft","property_damage","water_damage","fire","medical","travel_disruption","liability","other"],required:true},
 lossDescription:{type:String,required:true,trim:true,maxlength:5000},
 estimatedLossMinor:{type:Number,required:true,min:0,max:Number.MAX_SAFE_INTEGER},
 currency:{type:String,required:true,uppercase:true,minlength:3,maxlength:3},
 severity:{type:String,enum:["low","medium","high","critical"],default:"medium",index:true},
 status:{type:String,enum:["submitted","triage","under_review","awaiting_documents","investigation","approved","rejected","settled","closed"],default:"submitted",index:true},
 assignedAdjusterId:{type:Schema.Types.ObjectId,ref:"User",default:null},
 decision:{type:String,trim:true,maxlength:2000,default:""},
 decisionBy:{type:Schema.Types.ObjectId,ref:"User",default:null},
 decidedAt:{type:Date,default:null},
 settlementAmountMinor:{type:Number,min:0,max:Number.MAX_SAFE_INTEGER,default:null},
 settledAt:{type:Date,default:null},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true,optimisticConcurrency:true});
claimSchema.index({organizationId:1,claimNumber:1},{unique:true});
claimSchema.index({organizationId:1,status:1,reportedAt:-1});
claimSchema.index({organizationId:1,policyholderUserId:1,reportedAt:-1});
claimSchema.index({organizationId:1,assignedAdjusterId:1,status:1});
export const Claim=model("Claim",claimSchema);
