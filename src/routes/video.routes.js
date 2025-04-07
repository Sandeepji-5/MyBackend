import {Router} from "express";
import {
    publishAVideo,
    getAllVideos
} from "../controllers/video.controller.js";  
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"        



const router = Router();
router.route("/publish").post(verifyJWT, upload.single("file"), publishAVideo)
router.route("/getall-videos").get(verifyJWT, getAllVideos);

export default router
