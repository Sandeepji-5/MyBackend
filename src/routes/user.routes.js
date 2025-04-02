import { Router } from "express";
import {
        loginUser,
        logoutUser,
        registerUser,
        refreshAccessToken,
        changedCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
        
     } from "../controllers/user.controller.js"; // Import the controller function
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/register").post(
    upload.fields([{
        name:"avatar",
        maxCount: 1
    },
{
    name:"coverImage",
    maxCount: 1
}
]),
registerUser); // Use the imported function

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post( refreshAccessToken)
router.route("/change-password").post(verifyJWT, changedCurrentPassword)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
router.route("/current-user").get(verifyJWT, getCurrentUser);


export default router; 

