// controllers/clinicianController.js
import { getIO } from "../config/socket.js";
import db from "../config/db.js";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration — reads from env vars
console.log("Cloudinary env check:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  keyPresent: !!process.env.CLOUDINARY_API_KEY,
  secretPresent: !!process.env.CLOUDINARY_API_SECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Lazy OpenAI init — only throws if AI is actually called
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// ─── Helper: resolve clinician_id from user_id ────────────────────────────────
// Used by almost every route — keeps queries DRY
const getClinicianId = async (userId) => {
  const [rows] = await db.execute(
    "SELECT clinician_id FROM clinicians WHERE user_id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0].clinician_id : null;
};

// ─── GET /api/clinicians/me ───────────────────────────────────────────────────
// Returns basic clinician identity for navbar/header display
export const getClinicianMe = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await db.execute(
      `SELECT c.clinician_id, c.clinic_name, u.full_name, u.email, u.role
       FROM clinicians c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Clinician not found" });
    }

    const row = rows[0];
    return res.json({
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      clinicianId: row.clinician_id,
      clinicName: row.clinic_name || "Clinic",
      // nested object for components that expect clinician.clinician_id
      clinician: {
        clinician_id: row.clinician_id,
        clinic_name: row.clinic_name || "Clinic",
      },
    });
  } catch (err) {
    console.error("getClinicianMe error:", err);
    return res.status(500).json({ message: "Failed to load clinician" });
  }
};

// ─── GET /api/clinicians/dashboard ────────────────────────────────────────────
// Aggregates stats, next appointment, upcoming list and notifications
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);

    if (!clinicianId)
      return res.status(404).json({ error: "Clinician profile not found" });

    const [[clinicianInfo]] = await db.execute(
      `SELECT c.clinic_name, u.full_name
       FROM clinicians c JOIN users u ON c.user_id = u.user_id
       WHERE c.clinician_id = ?`,
      [clinicianId]
    );

    const [[{ appointmentsToday }]] = await db.execute(
      `SELECT COUNT(*) AS appointmentsToday
       FROM appointments
       WHERE clinician_id = ?
         AND DATE(appointment_date) = CURDATE()
         AND status NOT IN ('cancelled', 'no_show')`,
      [clinicianId]
    );

    const [[{ checkedInNow }]] = await db.execute(
      `SELECT COUNT(*) AS checkedInNow
       FROM appointments
       WHERE clinician_id = ?
         AND DATE(appointment_date) = CURDATE()
         AND status = 'checked_in'`,
      [clinicianId]
    );

    const [[{ walkInQueue }]] = await db.execute(
      `SELECT COUNT(*) AS walkInQueue
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.clinician_id = ?
         AND DATE(a.appointment_date) = CURDATE()
         AND p.is_walkin = 1
         AND a.status IN ('booked', 'checked_in')`,
      [clinicianId]
    );

    const [[{ casesCreatedToday }]] = await db.execute(
      `SELECT COUNT(*) AS casesCreatedToday
       FROM cases
       WHERE clinician_id = ?
         AND DATE(created_at) = CURDATE()`,
      [clinicianId]
    );

    const [[{ sentToDerm }]] = await db.execute(
      `SELECT COUNT(*) AS sentToDerm
       FROM cases
       WHERE clinician_id = ? AND status = 'sent_to_derm'`,
      [clinicianId]
    );

    const [[{ treatmentReady }]] = await db.execute(
      `SELECT COUNT(*) AS treatmentReady
       FROM cases
       WHERE clinician_id = ? AND status = 'treatment_ready'`,
      [clinicianId]
    );

    const [[{ completedCases }]] = await db.execute(
      `SELECT COUNT(*) AS completedCases
       FROM cases
       WHERE clinician_id = ? AND status = 'completed'`,
      [clinicianId]
    );

    const [[{ pendingAppointments }]] = await db.execute(
      `SELECT COUNT(*) AS pendingAppointments
       FROM appointments
       WHERE clinician_id = ?
         AND DATE(appointment_date) = CURDATE()
         AND status = 'booked'`,
      [clinicianId]
    );

    const [nextApptRows] = await db.execute(
      `SELECT
         a.appointment_id,
         a.appointment_date,
         a.reason_for_visit,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         p.patient_id,
         p.contact_info AS phone
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.clinician_id = ?
         AND a.appointment_date >= NOW()
         AND a.status IN ('booked', 'checked_in')
       ORDER BY a.appointment_date ASC
       LIMIT 1`,
      [clinicianId]
    );

    const [upcomingToday] = await db.execute(
      `SELECT
         a.appointment_id,
         a.appointment_date,
         a.status,
         a.reason_for_visit,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         p.patient_id,
         p.is_walkin
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.clinician_id = ?
         AND DATE(a.appointment_date) = CURDATE()
         AND a.status NOT IN ('cancelled', 'no_show', 'completed')
       ORDER BY a.appointment_date ASC
       LIMIT 5`,
      [clinicianId]
    );

    const [notifications] = await db.execute(
      `SELECT notification_id, message, type, is_read, created_at
       FROM notifications
       WHERE clinician_id = ?
       ORDER BY is_read ASC, created_at DESC
       LIMIT 10`,
      [clinicianId]
    );

    const [[{ unreadCount }]] = await db.execute(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE clinician_id = ? AND is_read = 0`,
      [clinicianId]
    );

    res.json({
      clinician: {
        full_name: clinicianInfo.full_name,
        clinic_name: clinicianInfo.clinic_name || "Clinic",
        clinician_id: clinicianId,
      },
      stats: {
        appointmentsToday,
        checkedInNow,
        walkInQueue,
        casesCreatedToday,
        sentToDerm,
        treatmentReady,
        completedCases,
        pendingAppointments,
      },
      nextAppointment: nextApptRows[0] || null,
      upcomingToday,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/clinicians/notifications ────────────────────────────────────────
// Returns full notification list + unread count
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);

    if (!clinicianId) return res.json({ notifications: [], unreadCount: 0 });

    const [notifications] = await db.execute(
      `SELECT notification_id, message, type, is_read, created_at
       FROM notifications
       WHERE clinician_id = ?
       ORDER BY is_read ASC, created_at DESC
       LIMIT 20`,
      [clinicianId]
    );

    const [[{ unreadCount }]] = await db.execute(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE clinician_id = ? AND is_read = 0`,
      [clinicianId]
    );

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ─── GET /api/clinicians/notifications/count ──────────────────────────────────
// Lightweight endpoint — only returns badge count
export const getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);

    if (!clinicianId) return res.json({ unreadCount: 0 });

    const [[{ unreadCount }]] = await db.execute(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE clinician_id = ? AND is_read = 0`,
      [clinicianId]
    );

    res.json({ unreadCount });
  } catch (error) {
    console.error("getNotificationCount error:", error);
    res.status(500).json({ error: "Failed to load notification count" });
  }
};

// ─── PATCH /api/clinicians/notifications/:id/read ─────────────────────────────
// Marks a single notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);

    if (!clinicianId)
      return res.status(404).json({ error: "Clinician not found" });

    await db.execute(
      "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND clinician_id = ?",
      [id, clinicianId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("markNotificationRead error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// ─── PATCH /api/clinicians/notifications/read-all ─────────────────────────────
// Marks all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);

    if (!clinicianId)
      return res.status(404).json({ error: "Clinician not found" });

    await db.execute(
      "UPDATE notifications SET is_read = 1 WHERE clinician_id = ?",
      [clinicianId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// ─── GET /api/clinicians/profile ──────────────────────────────────────────────
// Used by profile/settings page — enforces clinician role
export const getClinicianProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [users] = await db.execute(
      "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
      [userId]
    );
    if (!users.length) return res.status(404).json({ error: "User not found" });

    if (users[0].role !== "clinician")
      return res.status(403).json({ error: "User is not a clinician" });

    const [clinicians] = await db.execute(
      "SELECT clinician_id, clinic_name FROM clinicians WHERE user_id = ?",
      [userId]
    );
    if (!clinicians.length)
      return res.status(404).json({ error: "Clinician profile not found" });

    res.json({
      fullName: users[0].full_name,
      email: users[0].email,
      role: users[0].role,
      clinicianId: clinicians[0].clinician_id,
      clinicName: clinicians[0].clinic_name || "Clinic",
    });
  } catch (error) {
    console.error("getClinicianProfile error:", error);
    res.status(500).json({ error: "Failed to load clinician profile" });
  }
};

// ─── POST /api/clinicians/patients/new ────────────────────────────────────────
// Creates a new patient; enforces unique phone per DB
export const createNewPatient = async (req, res) => {
  let connection;
  try {
    const { first_name, last_name, phone, gender, date_of_birth, occupation } =
      req.body;

    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
      return res
        .status(400)
        .json({ message: "First name, last name and phone required" });
    }

    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    connection = await db.getConnection();
    await connection.beginTransaction();

    const clinicianId = await getClinicianId(userId);
    if (!clinicianId) {
      await connection.rollback();
      return res.status(404).json({ message: "Clinician not found" });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    const [existing] = await connection.execute(
      "SELECT patient_id FROM patients WHERE contact_info = ?",
      [cleanPhone]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Patient with this phone number already exists",
        patient_id: existing[0].patient_id,
      });
    }

    const safeSex = ["male", "female", "other"].includes(gender?.toLowerCase())
      ? gender.toLowerCase()
      : null;

    const [result] = await connection.execute(
      `INSERT INTO patients
         (first_name, last_name, date_of_birth, contact_info, sex, occupation, clinician_id, is_walkin)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        first_name.trim(),
        last_name.trim(),
        date_of_birth || null,
        cleanPhone,
        safeSex,
        occupation?.trim() || null,
        clinicianId,
      ]
    );

    await connection.commit();

    res.status(201).json({
      patient_id: result.insertId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      message: "Patient created successfully",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("createNewPatient error:", error);
    const msg =
      error.code === "ER_DUP_ENTRY"
        ? "Phone number already registered"
        : error.code === "ER_TRUNCATED_WRONG_VALUE"
        ? "Invalid data — check gender"
        : "Failed to create patient";
    res.status(500).json({ message: msg });
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET /api/clinicians/patients/search ──────────────────────────────────────
// When q is empty: recent patients; otherwise search name/phone/id
export const searchPatients = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const limitRaw = Number(req.query.limit ?? 10);
    const limit = Number.isInteger(limitRaw)
      ? Math.max(1, Math.min(limitRaw, 50))
      : 10;

    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const term = String(q).trim();
    const like = `%${term}%`;

    if (!term) {
      const [recent] = await db.execute(
        `SELECT
           patient_id,
           CONCAT(first_name, ' ', last_name) AS full_name,
           contact_info,
           (SELECT COUNT(*) FROM cases c WHERE c.patient_id = patients.patient_id) AS case_count
         FROM patients
         WHERE clinician_id = ?
         ORDER BY created_at DESC
         LIMIT ${limit}`,
        [clinicianId]
      );
      return res.json({ patients: recent });
    }

    const [patients] = await db.execute(
      `SELECT
         patient_id,
         CONCAT(first_name, ' ', last_name) AS full_name,
         contact_info,
         (SELECT COUNT(*) FROM cases c WHERE c.patient_id = patients.patient_id) AS case_count
       FROM patients
       WHERE clinician_id = ?
         AND (
           first_name   LIKE ?
           OR last_name  LIKE ?
           OR contact_info LIKE ?
           OR CAST(patient_id AS CHAR) LIKE ?
         )
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      [clinicianId, like, like, like, like]
    );

    return res.json({ patients });
  } catch (error) {
    console.error("searchPatients error:", error);
    return res
      .status(500)
      .json({ message: "Search failed", error: error.message });
  }
};

// ─── GET /api/clinicians/patients/:patientId ──────────────────────────────────
// Returns a single patient record; enforces clinician ownership
export const getPatientById = async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId <= 0)
      return res.status(400).json({ message: "Invalid patientId" });

    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const [rows] = await db.execute(
      `SELECT patient_id, first_name, last_name, contact_info,
              date_of_birth, sex, occupation, is_walkin, created_at
       FROM patients
       WHERE patient_id = ? AND clinician_id = ?
       LIMIT 1`,
      [patientId, clinicianId]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Patient not found" });

    return res.json({ patient: rows[0] });
  } catch (error) {
    console.error("getPatientById error:", error);
    return res.status(500).json({ message: "Failed to load patient" });
  }
};

// ─── GET /api/clinicians/patients/:patientId/cases ────────────────────────────
// Returns case history for a patient (used in patient detail view)
export const getPatientCases = async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId <= 0)
      return res.status(400).json({ message: "Invalid patientId" });

    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const [cases] = await db.execute(
      `SELECT
         case_id,
         created_at,
         status,
         chief_complaint,
         JSON_UNQUOTE(JSON_EXTRACT(vitals_json, '$.bp'))     AS bp,
         JSON_UNQUOTE(JSON_EXTRACT(vitals_json, '$.temp'))   AS temp,
         JSON_UNQUOTE(JSON_EXTRACT(vitals_json, '$.weight')) AS weight,
         image_count
       FROM cases
       WHERE patient_id = ? AND clinician_id = ?
       ORDER BY created_at DESC`,
      [patientId, clinicianId]
    );

    return res.json({ cases });
  } catch (error) {
    console.error("getPatientCases error:", error);
    return res.status(500).json({ message: "Failed to load case history" });
  }
};

// ─── POST /api/clinicians/patients/:patientId/ai-profile ──────────────────────
// Builds a structured patient context and asks OpenAI for a 3‑paragraph summary
export const getPatientAIProfile = async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId <= 0)
      return res.status(400).json({ message: "Invalid patientId" });

    const clinicianId = await getClinicianId(req.user.user_id);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const [patients] = await db.execute(
      `SELECT first_name, last_name, date_of_birth, sex, contact_info
       FROM patients WHERE patient_id = ? AND clinician_id = ?`,
      [patientId, clinicianId]
    );
    if (!patients.length)
      return res.status(404).json({ message: "Patient not found" });

    const p = patients[0];
    const age = p.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(p.date_of_birth).getTime()) / 3.156e10
        )
      : null;

    const [cases] = await db.execute(
      `SELECT case_id, chief_complaint, lesion_location,
              lesion_type, symptoms, status, created_at
       FROM cases
       WHERE patient_id = ? AND clinician_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [patientId, clinicianId]
    );

    const [diagnoses] = await db.execute(
      `SELECT d.final_diagnosis, d.notes, d.approved_at,
              u.full_name AS dermatologist_name
       FROM diagnoses d
       JOIN dermatologists dr ON d.dermatologist_id = dr.dermatologist_id
       JOIN users u            ON dr.user_id         = u.user_id
       JOIN cases c            ON d.case_id          = c.case_id
       WHERE c.patient_id = ?
       ORDER BY d.approved_at DESC LIMIT 3`,
      [patientId]
    );

    const [treatments] = await db.execute(
      `SELECT tp.medications, tp.lifestyle_advice,
              tp.follow_up_instructions, tp.created_at
       FROM treatment_plans tp
       JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
       JOIN cases c     ON d.case_id       = c.case_id
       WHERE c.patient_id = ? AND tp.approved = 1
       ORDER BY tp.created_at DESC LIMIT 1`,
      [patientId]
    );

    const [conditions] = await db.execute(
      `SELECT condition_name, severity, notes, date_recorded
       FROM patient_conditions WHERE patient_id = ?
       ORDER BY date_recorded DESC`,
      [patientId]
    );

    const [medications] = await db.execute(
      `SELECT medication_name, dosage, start_date
       FROM patient_medications WHERE patient_id = ?`,
      [patientId]
    );

    const [allergies] = await db.execute(
      `SELECT allergy_name, reaction, severity
       FROM patient_allergies WHERE patient_id = ?`,
      [patientId]
    );

    const patientContext = {
      name: `${p.first_name} ${p.last_name}`,
      age: age ?? "unknown",
      sex: p.sex ?? "unknown",
      contact: p.contact_info,
      current_case: cases[0]
        ? {
            chief_complaint: cases[0].chief_complaint,
            lesion_location: cases[0].lesion_location,
            lesion_type: cases[0].lesion_type,
            symptoms: cases[0].symptoms,
            status: cases[0].status,
          }
        : null,
      diagnosis_history: diagnoses.map((d) => ({
        diagnosis: d.final_diagnosis,
        notes: d.notes,
        dermatologist: d.dermatologist_name,
        date: d.approved_at,
      })),
      latest_treatment: treatments[0]
        ? {
            medications: treatments[0].medications,
            lifestyle_advice: treatments[0].lifestyle_advice,
            follow_up: treatments[0].follow_up_instructions,
          }
        : null,
      known_conditions: conditions.map(
        (c) => `${c.condition_name} (${c.severity})`
      ),
      current_medications: medications.map(
        (m) => `${m.medication_name} ${m.dosage}`
      ),
      allergies: allergies.map(
        (a) => `${a.allergy_name} — ${a.reaction} (${a.severity})`
      ),
    };

    const aiAssessment = await generatePatientProfile(patientContext);

    return res.json({
      full_name: `${p.first_name} ${p.last_name}`,
      demographics: {
        age: age,
        gender: p.sex,
        contact: p.contact_info,
      },
      current_case: cases[0]
        ? {
            chief_complaint: cases[0].chief_complaint,
            lesion_location: cases[0].lesion_location,
            status: cases[0].status,
          }
        : null,
      medical_history: {
        conditions:
          conditions
            .map((c) => `${c.condition_name} (${c.severity})`)
            .join(", ") || "None recorded",
        medications:
          medications
            .map((m) => `${m.medication_name} ${m.dosage}`)
            .join(", ") || "None recorded",
      },
      ai_clinical_assessment: aiAssessment,
    });
  } catch (error) {
    console.error("getPatientAIProfile error:", error);
    return res.status(500).json({ message: "Failed to load AI profile" });
  }
};

// OpenAI helper — returns a safe fallback on error
async function generatePatientProfile(context) {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content:
            "You are a clinical AI assistant supporting a clinician in a teledermatology system. " +
            "Given a patient's structured medical data, write a concise clinical assessment. " +
            "Structure your response in exactly 3 short paragraphs:\n" +
            "1. CLINICAL SUMMARY: Who is this patient and what is their skin condition history.\n" +
            "2. CURRENT STATUS: What is happening right now — active case, pending results, or treatment progress.\n" +
            "3. RECOMMENDATION: One clear action the clinician should prioritise today.\n" +
            "Be professional, concise, and clinically precise. No bullet points. No greetings.",
        },
        {
          role: "user",
          content: `Generate a clinical profile assessment for this patient:\n${JSON.stringify(
            context,
            null,
            2
          )}`,
        },
      ],
    });

    return (
      response.choices[0]?.message?.content?.trim() ??
      "AI assessment unavailable at this time. Please review patient records manually."
    );
  } catch (err) {
    console.error("OpenAI profile error:", err.message);
    return "AI assessment unavailable at this time. Please review patient records manually.";
  }
}

// ─── POST /api/clinicians/cases/submit ────────────────────────────────────────
// Creates a new case and notifies clinician; used by your wizard Step 5
export const submitCase = async (req, res) => {
  let connection;
  try {
    const {
      patient_id,
      vitals,
      chief_complaint,
      lesion_duration,
      lesion_location,
      symptoms,
      prior_treatment,
      lesion_type,
      image_count,
      parent_case_id,
    } = req.body;

    const userId = req.user.user_id;
    const clinicianId = await getClinicianId(userId);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO cases (
         patient_id, clinician_id, chief_complaint, lesion_duration,
         symptoms, prior_treatment, lesion_location, lesion_type,
         vitals_json, image_count, parent_case_id, status, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent_to_derm', NOW())`,
      [
        patient_id,
        clinicianId,
        chief_complaint || null,
        lesion_duration || null,
        symptoms || null,
        prior_treatment || null,
        lesion_location || null,
        lesion_type || null,
        vitals || null,
        image_count || 0,
        parent_case_id || null,
      ]
    );

    await connection.execute(
      `INSERT INTO notifications (clinician_id, message, type)
       VALUES (?, ?, 'case_update')`,
      [clinicianId, `Case #${result.insertId} submitted to dermatologist`]
    );

    await connection.commit();

    res.status(201).json({
      case_id: result.insertId,
      patient_id,
      status: "sent_to_derm",
      message: "Case submitted successfully to dermatologist",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("submitCase error:", error);
    res.status(500).json({ message: "Failed to submit case" });
  } finally {
    if (connection) connection.release();
  }
};

// ─── POST /api/clinicians/cases/:caseId/images ────────────────────────────────
// Uploads images to Cloudinary and stores URLs in case_images; updates image_count
export const uploadImagesForCase = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    if (!Number.isInteger(caseId) || caseId <= 0) {
      return res.status(400).json({ message: "Invalid caseId" });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const userId = req.user.user_id;

    // Ownership check — ensure case belongs to this clinician
    const [rows] = await db.execute(
      `SELECT c.case_id
       FROM cases c
       JOIN clinicians cl ON c.clinician_id = cl.clinician_id
       WHERE c.case_id = ? AND cl.user_id = ?`,
      [caseId, userId]
    );
    if (!rows.length) {
      return res.status(403).json({ message: "Not allowed for this case" });
    }

    // Upload each file buffer to Cloudinary
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "akomaderma/cases", resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          )
          .end(file.buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);

    // Insert Cloudinary URLs into case_images (case_id, file_path)
    const values = urls.map((url) => [caseId, url]);

    await db.query("INSERT INTO case_images (case_id, file_path) VALUES ?", [
      values,
    ]);

    // Update denormalized image_count on cases
    await db.execute("UPDATE cases SET image_count = ? WHERE case_id = ?", [
      urls.length,
      caseId,
    ]);

    res.status(201).json({ message: "Images uploaded", count: urls.length });
  } catch (error) {
    console.error("uploadImagesForCase error:", error);
    res.status(500).json({ message: "Failed to upload images" });
  }
};

// ─── PUT /api/clinicians/patients/:patientId/vitals ───────────────────────────
// Updates vitals_json on the most recent case for a patient
export const updateLatestCaseVitals = async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId <= 0)
      return res.status(400).json({ message: "Invalid patientId" });

    const userId = req.user.user_id;
    const { vitals } = req.body;

    if (!vitals || typeof vitals !== "object")
      return res.status(400).json({ message: "Invalid vitals payload" });

    const clinicianId = await getClinicianId(userId);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const [cases] = await db.execute(
      `SELECT case_id FROM cases
       WHERE patient_id = ? AND clinician_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [patientId, clinicianId]
    );
    if (!cases.length)
      return res
        .status(404)
        .json({ message: "No cases found for this patient" });

    await db.execute("UPDATE cases SET vitals_json = ? WHERE case_id = ?", [
      JSON.stringify(vitals),
      cases[0].case_id,
    ]);

    return res.json({ message: "Vitals updated", case_id: cases[0].case_id });
  } catch (error) {
    console.error("updateLatestCaseVitals error:", error);
    return res.status(500).json({ message: "Failed to update vitals" });
  }
};

// ─── GET /api/clinicians/cases ────────────────────────────────────────────────
// Returns all cases for the clinician — used by cases list page
export const getCases = async (req, res) => {
  try {
    const clinicianId = await getClinicianId(req.user.user_id);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const [cases] = await db.execute(
      `SELECT
         c.case_id,
         c.status,
         c.chief_complaint,
         c.lesion_location,
         c.image_count,
         c.created_at,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         p.patient_id
       FROM cases c
       JOIN patients p ON c.patient_id = p.patient_id
       WHERE c.clinician_id = ?
       ORDER BY c.created_at DESC`,
      [clinicianId]
    );

    res.json({ cases });
  } catch (error) {
    console.error("getCases error:", error);
    res.status(500).json({ message: "Failed to load cases" });
  }
};

// ─── GET /api/clinicians/patients ─────────────────────────────────────────────
// Returns all patients for clinician, optional ?filter=walkin
export const getPatients = async (req, res) => {
  try {
    const clinicianId = await getClinicianId(req.user.user_id);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const { filter } = req.query;

    let query = `
      SELECT
        p.patient_id,
        p.first_name,
        p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
        p.date_of_birth,
        p.sex,
        p.contact_info,
        p.occupation,
        p.is_walkin,
        p.created_at,
        (SELECT COUNT(*) FROM cases c WHERE c.patient_id = p.patient_id) AS case_count
      FROM patients p
      WHERE (p.clinician_id = ? OR p.created_by = ?)
    `;
    const queryParams = [clinicianId, clinicianId];

    if (filter === "walkin") query += " AND p.is_walkin = 1";

    query += " ORDER BY p.created_at DESC";

    const [patients] = await db.execute(query, queryParams);

    res.json({ patients });
  } catch (error) {
    console.error("getPatients error:", error);
    res.status(500).json({ message: "Failed to load patients" });
  }
};

// ─── GET /api/clinicians/cases/:caseId ────────────────────────────────────────
// Returns full case detail including diagnosis, treatment and images
export const getCaseById = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const clinicianId = await getClinicianId(req.user.user_id);
    if (!clinicianId)
      return res.status(404).json({ message: "Clinician not found" });

    const [[caseRow]] = await db.execute(
      `SELECT
         c.*,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         p.date_of_birth  AS patient_dob,
         p.sex            AS patient_sex,
         p.contact_info   AS patient_contact
       FROM cases c
       JOIN patients p ON c.patient_id = p.patient_id
       WHERE c.case_id = ? AND c.clinician_id = ?`,
      [caseId, clinicianId]
    );
    if (!caseRow) return res.status(404).json({ message: "Case not found" });

    const [[diagnosis = null]] = await db.execute(
      `SELECT d.*, CONCAT(u.full_name) AS dermatologist_name
       FROM diagnoses d
       JOIN dermatologists dr ON d.dermatologist_id = dr.dermatologist_id
       JOIN users u ON dr.user_id = u.user_id
       WHERE d.case_id = ?
       ORDER BY d.approved_at DESC LIMIT 1`,
      [caseId]
    );

    const [[treatment = null]] = await db.execute(
      `SELECT tp.*
       FROM treatment_plans tp
       JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
       WHERE d.case_id = ?
       ORDER BY tp.created_at DESC LIMIT 1`,
      [caseId]
    );

    const [images] = await db.execute(
      "SELECT id, file_path FROM case_images WHERE case_id = ? ORDER BY created_at ASC",
      [caseId]
    );

    res.json({ case: caseRow, diagnosis, treatment, images });
  } catch (error) {
    console.error("getCaseById error:", error);
    res.status(500).json({ message: "Failed to load case" });
  }
};

// ─── POST /api/clinicians/billing ─────────────────────────────────────────────
// Creates a billing record and marks the case as completed
export const createInvoice = async (req, res) => {
  const userId = req.user.user_id;
  const clinicianId = await getClinicianId(userId);

  if (!clinicianId)
    return res.status(404).json({ message: "Clinician not found" });

  const {
    case_id,
    patient_id,
    fees,
    total_amount,
    payment_method,
    payment_reference,
    notes,
  } = req.body;

  if (!case_id || !patient_id || !fees || !total_amount || !payment_method)
    return res
      .status(400)
      .json({ message: "Missing required billing fields." });

  const methodMap = {
    cash: "cash",
    momo: "momo",
    nhis: "insurance",
    card_pos: "other",
  };
  const mappedMethod = methodMap[payment_method] || "other";

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO billing
         (case_id, patient_id, clinician_id, total_amount,
          payment_method, payment_status, notes, paid_at)
       VALUES (?, ?, ?, ?, ?, 'paid', ?, NOW())`,
      [
        case_id,
        patient_id,
        clinicianId,
        total_amount,
        mappedMethod,
        notes || null,
      ]
    );

    await connection.execute(
      "UPDATE cases SET status = 'completed' WHERE case_id = ?",
      [case_id]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Invoice created and case marked as completed.",
      invoice_id: result.insertId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("createInvoice error:", err);
    return res.status(500).json({ message: "Failed to create invoice." });
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET /api/clinicians/billing ──────────────────────────────────────────────
// Returns all invoices for this clinician
export const getInvoices = async (req, res) => {
  const userId = req.user.user_id;
  const clinicianId = await getClinicianId(userId);

  if (!clinicianId)
    return res.status(404).json({ message: "Clinician not found" });

  try {
    const [rows] = await db.execute(
      `SELECT
         b.bill_id                                  AS invoice_id,
         b.case_id,
         b.patient_id,
         CONCAT(p.first_name, ' ', p.last_name)    AS patient_name,
         b.total_amount,
         b.payment_method,
         b.payment_status                           AS status,
         b.notes,
         b.paid_at,
         b.created_at
       FROM billing b
       JOIN patients p ON p.patient_id = b.patient_id
       WHERE b.clinician_id = ?
       ORDER BY b.created_at DESC`,
      [clinicianId]
    );
    return res.status(200).json({ invoices: rows });
  } catch (err) {
    console.error("getInvoices error:", err);
    return res.status(500).json({ message: "Failed to fetch invoices." });
  }
};

// ─── GET /api/clinicians/billing/:invoiceId ───────────────────────────────────
// Returns a single invoice with patient contact
export const getInvoiceById = async (req, res) => {
  const userId = req.user.user_id;
  const clinicianId = await getClinicianId(userId);
  const { invoiceId } = req.params;

  if (!clinicianId)
    return res.status(404).json({ message: "Clinician not found" });

  try {
    const [rows] = await db.execute(
      `SELECT
         b.*,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         p.contact_info                          AS patient_contact
       FROM billing b
       JOIN patients p ON p.patient_id = b.patient_id
       WHERE b.bill_id = ? AND b.clinician_id = ?`,
      [invoiceId, clinicianId]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Invoice not found." });

    return res.status(200).json({ invoice: rows[0] });
  } catch (err) {
    console.error("getInvoiceById error:", err);
    return res.status(500).json({ message: "Failed to fetch invoice." });
  }
};

// ─── PATCH /api/clinicians/billing/:invoiceId/status ──────────────────────────
// Updates payment_status; only allows pending/paid/waived
export const updateInvoiceStatus = async (req, res) => {
  const userId = req.user.user_id;
  const clinicianId = await getClinicianId(userId);
  const { invoiceId } = req.params;
  const { status } = req.body;

  if (!clinicianId)
    return res.status(404).json({ message: "Clinician not found" });

  const ALLOWED = ["pending", "paid", "waived"];
  if (!ALLOWED.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${ALLOWED.join(", ")}`,
    });
  }

  try {
    const [result] = await db.execute(
      "UPDATE billing SET payment_status = ? WHERE bill_id = ? AND clinician_id = ?",
      [status, invoiceId, clinicianId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Invoice not found." });

    return res.status(200).json({ message: "Invoice status updated.", status });
  } catch (err) {
    console.error("updateInvoiceStatus error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update invoice status." });
  }
};
