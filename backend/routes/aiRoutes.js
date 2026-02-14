import express from 'express';
import { generatePatientProfile } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/patient/:id/ai-profile', requireAuth, generatePatientProfile);

export default router;
