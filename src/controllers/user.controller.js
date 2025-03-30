import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"  


const generateAccessAndRefershTokens = async (userId) => {
    try{
    const user= await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken =  user.generateRefreshToken()
    user.refreshToken = refreshToken 
    
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something wend wrong while genersting Refresh Token")

    }
   

}

// register...........................
const registerUser  = asyncHandler( async (req, res)=>{
    // get user detail from the frontend
    // get validation not empty 
    // check if user already exists : username, email
    //check for image, check for avatar
    // upload them to cloudinary; avatar
    //create user object- create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return res


  

    const {fullName, email, username, password} = req.body
  // console.log("email", email);



    if([fullName, email, username, password].some((field)=> field?.trim()=== "")){
        throw new ApiError(400," All fields are required " )
    }

// // check if user already exists
    const existedUser = await User.findOne({
        $or:[{username: username}, {email: email}]
    })

    
    if(existedUser){
        throw new ApiError(409, "User With email or username already exists")
    }
    console.log(req.files);
     
    const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLoalPath = req.files?.coverImage[0]?.path;

    let coverImageLoalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
        coverImageLoalPath = req.files.coverImage[0].path
    }



    if(!avatarLocalPath){
        throw new ApiError(400, " Avatar file required"    
        )
    }

    const avatar = await  uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLoalPath)

    if(!avatar){
        throw new ApiError(400, " Avaatar file is required")
    }
    
const user  = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url || "", // it may not be available
    email,
    password,
    username:username.toLowerCase() // ✅ Correct
    
})
        

const createdUser = await User.findById(user._id).select("-password -refreshToken");
if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
}



return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
);
 })
// login user..........................
const loginUser =  asyncHandler(async(req, res)=>{
    //console.log("User in request:", req.user);
    if (req.user) {
        throw new ApiError(400, "User is already logged in");
    }
    // req body->data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const {email, username, password}= req.body
    if(!username && ! email){
        throw new ApiError(400, "username or email is required")
    }

    const user  = await  User.findOne({
        $or: [{ username: username }, { email:email}]
        
    })
    console.log("User found:", user);
    if(!user) 
    {
        throw new ApiError(404,"user does not exist");
    }

     const isPasswordValid =  await user.isPasswordCorrect(password)
    
     if(!isPasswordValid){
        throw new ApiError(401, "Invalid User credentials");
     }

     const {accessToken, refreshToken} = await generateAccessAndRefershTokens(user._id)

     const loggedInUser =  await User.findById(user._id)
     .select("-password -refreshToken")

     const options = {
        httpOnly: true,
        secure: true
     }
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshtoken", refreshToken, options)
     .json({"status":true,"data":user})
})

// logout User............................

const logoutUser =  asyncHandler(async(req, res) =>{
    console.log("User entered in the logout route");
    
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized request");
      }
   await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );
const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Ensure secure cookies only in production
    sameSite: "Strict", // Helps prevent CSRF attacks
};
return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User Loged Out"))
})

// refresh access token

const refreshAccessToken =   asyncHandler(async(req,res)=>
{
   const incomingRefreshToken  =  req.cookies.refreshToken || req.body.refreshToken
   
   if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

 try {
       const decodedToken = jwt.verify
              (
                 incomingRefreshToken,
                 process.env.REFRESH_TOKEN_SECRET
               )
       const user = awaitUser.findById(decodedToken?._id)
   
       if(!user){
            throw new ApiError(401, "Invalid RefreshToken")
       }
   
       if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401, "Refresh Token is expired or used")
       }
   
       const  options = {
           httpOnly: true,
           secure:true
       }
   
        const { accessToken, newRefreshToken} = await
         generateAccessAndRefershTokens(user._id)
       
         return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options) 
         .json(
           new ApiResponse(200,
               {
                   accessToken,
                   refreshToken: newRefreshToken
               },
               "Access Token Refreshed"
           )
         )
 } catch (error) {
    
     throw new ApiError(401, error?.message || "Invalid refresh token")
 }
})

const changedCurrentPassword = asyncHandler(async(req, res) => {
    
    const { oldPassword, newPassword} =  req.body

    const user = await User.findById(req.user._id)
    await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old  Password") 
    }
     
    user.password = newPassword
     await user.save({validateBeforeSave: false})   
     return res
     .status(200)
     .json(new ApiResponse(200, {}, "Password changed successfully"))   
})

const getCurrentUser = asyncHandler(async(req, res)=>{

    return res.status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Successfully"))
})

const updateAccountDetails  = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body      // get the data from the request body

    if(!fullName || !email){
        throw new ApiError(400, "Full Name and Email are required") 
    }
     const user =  User.findByIdAndUpdate  (   // find the user by id and update the fields
        req.user?._id,                        //
        {
            $set:{
                fullName,
                email:   email
            }                                   // $set is used to update the fields
        },
        {new: true}
    ).select("-password")                       // select all fields except password

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))// send the updated user
})

const updateUserAvatar = asyncHandler(async(req, res)=>{

    const avatarLocalPath = req.file?.path  // get the avatar path from the request file
    if(!avatarLocalPath){                   // check if avatar path is missing
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)// upload the avatar on cloudinary

    if(!avatar){                                        // check if avatar is uploaded
        throw new ApiError(400, "Error while Uploading Avatar");
    }
    const user  = await User.findByIdAndUpdate(req.user?._id, // find the user by id and update the avatar
        {
            $set:{
                avatar:avatar.url // set the avatar url in the user object
            }
        },
        { new: true}    // update the user with new avatar
    ).select("-password")   // select all fields except password
return res
.status(200)
.json(new ApiResponse(200, user,"Avatar is updated Successfully"))

})

const updateUserCoverImage = asyncHandler(async(req, res)=>{

    const coverImageLoalPath = req.file?.path  
    if(!coverImageLoalPath){                   // check if avatar path is missing
        throw new ApiError(400, "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(avatarLocalPath)// upload the coverImage on cloudinary

    if(!coverImage){                                        // check if coverImage is uploaded
        throw new ApiError(400, "Error while Uploading coverImage");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, // find the user by id and update the avatar
        {
            $set:{
                coverImage:coverImage.url // set the coverImage url in the user object
            }
        },
        { new: true}    //
    ).select("-password")   // select all fields except password
return res
.status(200)
.json(new ApiResponse(200, user, "Cover Image Is UpdatedSuccessfully"))


})

const getUserChannelProfile = asyncHandler(async(req, res)=>{

    const {username} = req.params           // get the username from the request params
    if(!username?.trim())                  // check if username is missing

        {throw new ApiError(400, "UserName Is Missing")}

       const channel =  await User.aggregate([              // aggregate the users collection to get the channel profile
            {
                $match:{
                    username: username?.toLowerCase()           // match the username with the request params
                }
            },
            {
                $lookup:{                                       // lookup the subscription collection to get the subscribers
                    from: "subscriptions",
                    localField: "_id",  
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {                                                   // lookup the subscription collection to get the channels subscribed to
                $lookup:{
                from: "subscription",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
        },

       {
         $addFields:{                                            // add fields to the user object

            subscribersCount:{                                   // count the number of subscribers
                $size: "$subscribers"
            },
            channelsSubscribedToCount:{                        // count the number of channels subscribed to
                $size:" $subscribedTo"
            },
            isSubscribed:{                                    // check if the user is subscribed to the channel
                $cond:{                                                                         
                    if:{$in: [req.user?._id,"$subscribers.subscriber"]},        // check if the user id is in the subscribers array
                    then: true,
                    else: false
                }
            }
         }
       },
       {
        $project:{                                                     // project the fields to be returned in the response
            fullName: 1,
            username:1,
            avatar:1,
            coverimage: 1,
            email: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
        }
       }
        ])    
        
        
    if(!channel?.length){                                   // check if channel is missing
        throw new ApiError(404, "Channel Does not Exist")
    }

    
return res
.status(200)
.json(new ApiResponse(200, channel[0], "User Channel Fetched Successfully"))


})

const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar:1
                                    }
                                }
                            ]
                        

                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully")) 

})





export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken, 
    changedCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar ,
    updateUserCoverImage,
    getUserChannelProfile ,
    getWatchHistory

}
 