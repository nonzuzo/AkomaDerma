// controllers/patientController.js - USE req.user.user_id like clinicianController
import db from "../config/db.js";

export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.user_id; // Match with the auth middleware

    // Get clinician_id first (like clinicianController)
    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [userId]
    );

    if (clinicians.length === 0) {
      return res.status(403).json({ error: "Clinician not found" });
    }

    const clinicianId = clinicians[0].clinician_id;

    if (!q || q.length < 2) return res.json([]);

    const [results] = await db.execute(
      `
      SELECT patient_id, first_name, last_name, date_of_birth, contact_info, is_walkin
      FROM patients WHERE clinician_id = ? 
      AND (patient_id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ?)
      ORDER BY created_at DESC LIMIT 10
    `,
      [clinicianId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json(results);
  } catch (error) {
    console.error("Patient search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};
