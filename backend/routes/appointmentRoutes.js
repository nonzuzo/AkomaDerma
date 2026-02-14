import express from "express";
import { getClinicianAppointments ,createAppointment} from '../controllers/appointmentController.js';
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/appointments', requireAuth, getClinicianAppointments);
router.post('/appointments', requireAuth, createAppointment);

export default router;
