import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"


export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        // console.log("Cookies:", req.cookies);
        // console.log("Authorization Header:", req.header("Authorization"));

        console.log("Request Headers:", req.cookies?.accessToken, req.header("Authorization"));

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log("Extracted Token:", token);
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("Decoded Token:", decodedToken);

        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        console.log("Found User:", user);
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})