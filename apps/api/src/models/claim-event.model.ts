import {Schema,model} from "mongoose";
const claimEventSchema=new Schema({
 organizationId:{type:Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
 claimId:{type:Schema.Types.ObjectId,ref:"Claim",required:true,index:true},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true},
 action:{type:String,required:true,trim:true,maxlength:80},
 fromStatus:{type:String,default:null},
 toStatus:{type:String,default:null},
 metadata:{type:Schema.Types.Mixed,default:{}},
 occurredAt:{type:Date,required:true,default:Date.now}
},{timestamps:true});
claimEventSchema.index({organizationId:1,claimId:1,occurredAt:1});
export const ClaimEvent=model("ClaimEvent",claimEventSchema);
