// routes/clinicianRoutes.js
import express from "express";
import {
  getClinicianMe,
  getClinicianProfile,
  getDashboardStats,
  getNotifications,
  getNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  createNewPatient,
  searchPatients,
  submitCase,
  getPatientById,
  uploadImagesForCase,
  getPatientCases,
  updateLatestCaseVitals,
  getPatientAIProfile,
  getCases,
  getPatients,
  getCaseById,
  getInvoices, //
  getInvoiceById, //
  updateInvoiceStatus, //
  createInvoice,
} from "../controllers/clinicianController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadCaseImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ── Profile & Dashboard ───────────────────────────────────────────────────────
router.get("/me", requireAuth, getClinicianMe);
router.get("/profile", requireAuth, getClinicianProfile);
router.get("/dashboard", requireAuth, getDashboardStats);

// ── Notifications ─────────────────────────────────────────────────────────────
//  ORDER MATTERS — specific routes before param routes
router.get("/patients", requireAuth, getPatients);
router.get("/notifications", requireAuth, getNotifications);
router.get("/notifications/count", requireAuth, getNotificationCount);
router.patch("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.patch("/notifications/:id/read", requireAuth, markNotificationRead);

// ── Patients ──────────────────────────────────────────────────────────────────
router.post("/patients/new", requireAuth, createNewPatient);
router.get("/patients/search", requireAuth, searchPatients);
router.get("/patients/:patientId", requireAuth, getPatientById);
router.get("/patients/:patientId/cases", requireAuth, getPatientCases);
router.put("/patients/:patientId/vitals", requireAuth, updateLatestCaseVitals);

// AI Profile — now handled in clinicianController (no longer using aiController)
router.post(
  "/patients/:patientId/ai-profile",
  requireAuth,
  getPatientAIProfile
);

// ── Cases ─────────────────────────────────────────────────────────────────────
router.get("/cases", requireAuth, getCases);
router.post("/cases/submit", requireAuth, submitCase);
router.get("/cases/:caseId", requireAuth, getCaseById);
router.post(
  "/cases/:caseId/images",
  requireAuth,
  uploadCaseImages.array("images", 5),
  uploadImagesForCase
);

router.get("/billing", requireAuth, getInvoices);
router.post("/billing",requireAuth, createInvoice);  
router.get("/billing/:invoiceId", requireAuth, getInvoiceById);
router.patch("/billing/:invoiceId/status", requireAuth, updateInvoiceStatus);

console.log(" Clinician routes loaded");

export default router;
