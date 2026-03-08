// routes/dermatologistRoutes.js
import express from "express";
import {
  getDermatologistMe,
  getDermatologistDashboard,
  getPendingCaseCount,
  getDermCases,
  getDermCaseById,
  submitDiagnosis,
  submitTreatmentPlan,
  generateAITreatment,
  completeCaseWithDiagnosis,
  runAIAnalysis,
  getPatientList,
  getPatientHistory,
  getUnreadCount,           
  getNotifications,        
  markAllNotificationsRead, 
  markNotificationRead, 
  
  getProfileStats,
  updateProfile,
  changePassword,
} from "../controllers/dermatologistController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/me", requireAuth, getDermatologistMe);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard", requireAuth, getDermatologistDashboard);

// ── Cases — specific routes BEFORE param routes ───────────────────────────────
router.get("/cases/pending/count", requireAuth, getPendingCaseCount);
router.get("/cases", requireAuth, getDermCases);
router.get("/cases/:id", requireAuth, getDermCaseById);
router.post("/cases/:id/diagnose", requireAuth, submitDiagnosis);
router.post("/cases/:id/treatment/generate", requireAuth, generateAITreatment);
router.post("/cases/:id/treatment", requireAuth, submitTreatmentPlan);
router.post("/cases/:id/run-ai", requireAuth, runAIAnalysis);

// ── Patient History 
router.get("/patients", requireAuth, getPatientList);
router.get("/patients/:patientId/history", requireAuth, getPatientHistory);

// ── Notifications  
//SPECIFIC routes FIRST
router.get("/notifications/unread/count", requireAuth, getUnreadCount);
router.get("/notifications",              requireAuth, getNotifications);
router.patch("/notifications/read-all",   requireAuth, markAllNotificationsRead);

//PARAMETERIZED routes LAST
router.patch("/notifications/:id/read",  requireAuth, markNotificationRead);
// ── Legacy  
router.post("/cases/:caseId/complete", requireAuth, completeCaseWithDiagnosis);

//Profile Management
router.get("/profile/stats",  requireAuth, getProfileStats);

router.put("/profile", requireAuth, updateProfile);
router.put("/profile/password", requireAuth, changePassword);


console.log("Dermatologist routes loaded");

export default router;
