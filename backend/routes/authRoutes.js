// // here we are basically defining the  URLs the frontend will call, keeping the routes separate from the logic(MVC!)
//
import express from "express";
import {
  signup,
  login,
  getPendingUsers, //
  approveUser, //
  verifyPasscode,
  getAuthStatus,
  verifyToken,
  resetPassword,
 forgotPassword
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";


const router = express.Router();

// ROUTES
router.post("/signup", signup);
router.post("/login", login);
router.post("/status", getAuthStatus);
router.post("/verify-passcode", verifyPasscode);

//// ADMIN PROTECTED ROUTES - Require authenticatio
router.get("/pending-users", requireAuth, getPendingUsers);
router.post("/approve/:userId", approveUser);

// PROTECTED ROUTES
router.get("/verify", requireAuth, verifyToken);

// forgot/reset password routes (public)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);

router.post("/logout", (req, res) => {
  // JWT is stateless — logout is handled client-side by deleting the token
  // This endpoint exists so the frontend doesn't get a 404
  res.json({ success: true, message: "Logged out successfully" });
});
export default router;
