import mongoose from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const commentSchema =  new Schema({
    content:{
        type: string,
        required:true
    },
    video:{
    type: Schema.types.ObjectId,
    ref: "Video"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }


}, {timestamps: true}                 // to add createdAt and updatedAt fields

)

commentSchema.plugin(mongooseAggregatePaginate);  
export const Comment = mongoose.model("Comment", commentSchema);    