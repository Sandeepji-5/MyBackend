import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"; // Import the controller function
import {upload} from "../middlewares/multer.middleware.js"


const router = Router();

router.route("/register").post(
    upload.fields([{
        name:"avata",
        maxCount: 1
    },
{
    name:"coverImage",
    maxCount: 1
}]
),
        registerUser); // Use the imported function


export default router; 