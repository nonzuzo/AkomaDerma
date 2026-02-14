// routes/clinicianRoutes.js - REPLACE ENTIRE FILE
import express from "express";
import pool from "../config/db.js";
import {
  getClinicianProfile,
  getNotificationCount,
  getDashboardStats,
} from "../controllers/clinicianController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", requireAuth, getClinicianProfile);
router.get("/notifications", requireAuth, getNotificationCount);
router.get("/dashboard", requireAuth, getDashboardStats);

console.log("Clinician routes loaded: /me, /notifications, /dashboard");

export default router;
