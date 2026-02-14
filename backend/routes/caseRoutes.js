// routes/caseRoutes.js
import express from "express";
import { createCase, getMyCases } from "../controllers/caseController.js";
import { requireAuth } from "../middleware/authMiddleware.js"; // TODO: have to implement this  later

const router = express.Router();

// Clinician workflows
router.post("/", requireAuth, createCase); // New case + patient
router.get("/my-cases", requireAuth, getMyCases); // List my cases

export default router;
