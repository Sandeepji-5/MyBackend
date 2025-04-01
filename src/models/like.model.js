import mongoose from 'mongoose';


const likeSchema =  new Schema({
    video:{
    type: Schema.types.ObjectId,
    ref: "Video"
    },
    comment:{
    type: Schema.types.ObjectId,
    ref: "Comment"
    },
    tweet:{
    type: Schema.types.ObjectId,
    ref: "Tweet"
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }


}, {timestamps: true}
)


export const Like = mongoose.model("Like", likeSchema);
