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
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  createInvoice,
} from "../controllers/clinicianController.js";

// ── Appointment controller ────────────────────────────────────────────────────
import {
  getClinicianAppointments,
  createAppointmentForNewPatient,
  createAppointmentForExistingPatient,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadCaseImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ── Profile & Dashboard ───────────────────────────────────────────────────────
router.get("/me", requireAuth, getClinicianMe);
router.get("/profile", requireAuth, getClinicianProfile);
router.get("/dashboard", requireAuth, getDashboardStats);

// ── Notifications ─────────────────────────────────────────────────────────────
// ORDER MATTERS — /notifications/count must come before /notifications/:id
router.get("/notifications", requireAuth, getNotifications);
router.get("/notifications/count", requireAuth, getNotificationCount);
router.patch("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.patch("/notifications/:id/read", requireAuth, markNotificationRead);

// ── Patients ──────────────────────────────────────────────────────────────────
// ORDER MATTERS — /patients/search and /patients/new before /patients/:patientId
router.get("/patients", requireAuth, getPatients);
router.get("/patients/search", requireAuth, searchPatients);
router.post("/patients/new", requireAuth, createNewPatient);
router.get("/patients/:patientId", requireAuth, getPatientById);
router.get("/patients/:patientId/cases", requireAuth, getPatientCases);
router.put("/patients/:patientId/vitals", requireAuth, updateLatestCaseVitals);
router.post(
  "/patients/:patientId/ai-profile",
  requireAuth,
  getPatientAIProfile
);

// ── Cases ─────────────────────────────────────────────────────────────────────
// ORDER MATTERS — /cases/submit before /cases/:caseId
router.get("/cases", requireAuth, getCases);
router.post("/cases/submit", requireAuth, submitCase);
router.get("/cases/:caseId", requireAuth, getCaseById);
router.post(
  "/cases/:caseId/images",
  requireAuth,
  uploadCaseImages.array("images", 5),
  uploadImagesForCase
);

// ── Billing ───────────────────────────────────────────────────────────────────
// ORDER MATTERS — /billing/:invoiceId/status before /billing/:invoiceId
router.get("/billing", requireAuth, getInvoices);
router.post("/billing", requireAuth, createInvoice);
router.get("/billing/:invoiceId", requireAuth, getInvoiceById);
router.patch("/billing/:invoiceId/status", requireAuth, updateInvoiceStatus);

// ── Appointments ──────────────────────────────────────────────────────────────
// ORDER MATTERS — /appointments/new-patient and /appointments/existing-patient
// must come before /appointments/:id to avoid :id catching them as a param
router.get("/appointments", requireAuth, getClinicianAppointments);
router.post(
  "/appointments/new-patient",
  requireAuth,
  createAppointmentForNewPatient
);
router.post(
  "/appointments/existing-patient",
  requireAuth,
  createAppointmentForExistingPatient
);
router.patch("/appointments/:id/status", requireAuth, updateAppointmentStatus);
router.patch(
  "/appointments/:id/reschedule",
  requireAuth,
  rescheduleAppointment
);

console.log(" Clinician routes loaded");

export default router;
