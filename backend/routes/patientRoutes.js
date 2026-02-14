// routes/patientRoutes.js - FULL ESM SYNTAX
import db from '../config/db.js';
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js'; 
import { searchPatients } from '../controllers/patientController.js';

const router = express.Router();

// Search patients by PID/name (clinician's patients only)
router.get('/search', requireAuth, searchPatients);
 

export default router;

