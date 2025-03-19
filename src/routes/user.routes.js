import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"; // Import the controller function

const router = Router();

router.route("/register").post(registerUser); // Use the imported function

export default router; 