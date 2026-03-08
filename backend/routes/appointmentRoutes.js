// routes/appointmentRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js"; // 👈 fixed
import {
  getClinicianAppointments,
  createAppointmentForNewPatient,
  createAppointmentForExistingPatient,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

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

export default router;
