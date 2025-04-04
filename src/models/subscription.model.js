import mongoose,{ Schema} from "mongoose";

const subscriptionSchema = new Schema(
{
    subscriber:{
        types: Schema.Types.ObjectId, // one is subscribing
        ref: "User",
    },
    channel:{
        type: Schema.Types.ObjectId, // one to whom subscriber is subscribing
        ref: "User",
    } 
},{timestamps: true}                // to add createdAt and updatedAt fields
)
  
export const subscription = mongoose.model("Subscription", subscriptionSchema)
