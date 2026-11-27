import {Schema,model} from "mongoose";
const claimEventSchema=new Schema({
 organizationId:{type:Schema.Types.ObjectId,ref:"Organization",required:true,immutable:true,index:true},
 claimId:{type:Schema.Types.ObjectId,ref:"Claim",required:true,immutable:true,index:true},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true,immutable:true},
 action:{type:String,required:true,trim:true,maxlength:80,immutable:true},
 fromStatus:{type:String,default:null,immutable:true},
 toStatus:{type:String,default:null,immutable:true},
 metadata:{type:Schema.Types.Mixed,default:{},immutable:true},
 occurredAt:{type:Date,required:true,default:Date.now,immutable:true}
},{timestamps:{createdAt:true,updatedAt:false},strict:"throw"});
claimEventSchema.index({organizationId:1,claimId:1,occurredAt:1});
export const ClaimEvent=model("ClaimEvent",claimEventSchema);
