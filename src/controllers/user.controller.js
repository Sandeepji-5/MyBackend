import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefershTokens = async (userId) => {
    try{
    const user= await User.findById(userId)
    const accessToken = user.generateAccessToken
    const refreshToken =  user.generateRefreshToken
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
        $or:[ {username},{email}]
    })
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
     .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, 
                refreshToken
            }, "User Logged In Successfully"
        )
     )
})
// logout User............................
const logoutUser =  asyncHandler(async(req, res) =>{
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
    secure: true
}
return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User Loged Out"))
})


export {
    registerUser,
    loginUser,
    logoutUser
}
