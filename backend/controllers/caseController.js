// controllers/caseController.js
import pool from "../config/db.js";

// Clinician creates NEW CASE (with patient + case in one flow)
export const createCase = async (req, res) => {
  /// all the information needed from the clinician
  const {
    patient_first_name,
    patient_last_name,
    patient_dob,
    patient_sex,
    patient_contact,
    chief_complaint,
    lesion_duration,
    symptoms,
    prior_treatment,
    lesion_location,
    lesion_type,
  } = req.body;

  const clinician_user_id = req.user.user_id; // From authMiddleware

  try {
    // Get clinician_id from user_id- the realtionship between the 2
    const [clinicians] = await pool.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [clinician_user_id]
    );

    if (clinicians.length === 0) {
      return res.status(400).json({
        message: "Clinician profile not found. Complete profile first.",
      });
    }

    const clinician_id = clinicians[0].clinician_id;

    // Create patient (if new)
    const [patients] = await pool.execute(
      `INSERT INTO patients (first_name, last_name, date_of_birth, sex, contact_info) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        patient_first_name,
        patient_last_name,
        patient_dob,
        patient_sex,
        patient_contact,
      ]
    );
    const patient_id = patients.insertId;

    // Create case
    const [cases] = await pool.execute(
      `INSERT INTO cases (patient_id, clinician_id, chief_complaint, lesion_duration, 
        symptoms, prior_treatment, lesion_location, lesion_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        clinician_id,
        chief_complaint,
        lesion_duration,
        symptoms,
        prior_treatment,
        lesion_location,
        lesion_type,
      ]
    );

    res.status(201).json({
      message: "Case created successfully",
      case_id: cases.insertId,
      patient_id,
    });
  } catch (error) {
    console.error("Create case error:", error);
    res.status(500).json({ message: "Server error creating case" });
  }
};

// Clinician lists THEIR cases for the  dashboard
export const getMyCases = async (req, res) => {
  const clinician_user_id = req.user.user_id;

  try {
    const [cases] = await pool.execute(
      `
      SELECT c.*, p.first_name, p.last_name, p.sex, p.contact_info,
             d.final_diagnosis, d.approved_at
      FROM cases c
      JOIN patients p ON c.patient_id = p.patient_id
      LEFT JOIN diagnoses d ON c.case_id = d.case_id
      JOIN clinicians cl ON c.clinician_id = cl.clinician_id
      WHERE cl.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT 20
    `,
      [clinician_user_id]
    );

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching cases" });
  }
};
