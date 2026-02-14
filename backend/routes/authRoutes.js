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

export default router;
