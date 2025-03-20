import {asyncHandler} from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
const registerUser  = asyncHandler( async (req, res)=>{
 
  

    const {fullName, email, username, password} = req.body
    console.log("email", email);

    if([fullName, email, username, password].some((field)=> field?.trim()=== "")){
        throw new ApiError(400," All fields are required " )
    }

    const existedUser = User.findOne({
        $or:[{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User With email or username already exists")
    }
     
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLoalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, " Avatar file required"    
        )
    }

    const avatar = await  uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLoalPath)

    if(!avatar){
        throw new ApiError(400, " Avaatar filr is required")
    }
const user  = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username: username.toLowercase()
})
        

await createdUser.findById(user._id).select(
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500," something went wrong while registering the user")
}


return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
)
})
export {registerUser}