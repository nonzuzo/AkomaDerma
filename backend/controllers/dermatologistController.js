// controllers/dermatologistController.js
import db from "../config/db.js";
import { getIO } from "../config/socket.js"; // fixed circular import from ../index.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helper ───────────────────────────────────────────────────────────────────
// Resolves a user_id to a dermatologist_id — used in every controller
// to identify which dermatologist is making the request
const getDermatologistId = async (userId) => {
  const [rows] = await db.execute(
    "SELECT dermatologist_id FROM dermatologists WHERE user_id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0].dermatologist_id : null;
};

// ─── GET /me ──────────────────────────────────────────────────────────────────
// Returns the logged-in dermatologist's profile info
export const getDermatologistMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT d.dermatologist_id, d.specialization, d.years_experience,
              u.full_name, u.email
       FROM dermatologists d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.user_id = ?`,
      [req.user.user_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Dermatologist not found" });

    const r = rows[0];
    return res.json({
      fullName: r.full_name,
      email: r.email,
      specialization: r.specialization || "Dermatologist",
      yearsExperience: r.years_experience || 0,
      dermatologistId: r.dermatologist_id,
      memberSince:     r.member_since,   // for the derma to see how long they've been with the platform
    });
  } catch (err) {
    console.error("getDermatologistMe error:", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
};

// ─── GET /dashboard ───────────────────────────────────────────────────────────
// Returns clinical workload stats, pending case queue, awaiting-review cases,
// and recent activity. No billing or payment information is included —
// the dermatologist is a remote specialist and clinic billing is not their concern.
export const getDermatologistDashboard = async (req, res) => {
  try {
    const dermId = await getDermatologistId(req.user.user_id);
    if (!dermId)
      return res.status(404).json({ message: "Dermatologist not found" });

    // Total cases currently waiting for ANY dermatologist to review
    // (global queue — not filtered by dermId since cases are not pre-assigned)
    const [[{ pendingReview }]] = await db.execute(
      `SELECT COUNT(*) AS pendingReview FROM cases WHERE status = 'sent_to_derm'`
    );

    // How many diagnoses THIS dermatologist has submitted today
    const [[{ reviewedToday }]] = await db.execute(
      `SELECT COUNT(*) AS reviewedToday FROM diagnoses
       WHERE dermatologist_id = ? AND DATE(approved_at) = CURDATE()`,
      [dermId]
    );

    // Total cases in the active pipeline this week across all statuses
    // Gives the derm a sense of overall clinic volume
    const [[{ totalThisWeek }]] = await db.execute(
      `SELECT COUNT(*) AS totalThisWeek FROM cases
       WHERE status IN ('sent_to_derm', 'treatment_ready', 'completed')
         AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Cases where THIS dermatologist has submitted an approved treatment plan —
    // their measure of "work I have fully completed"
    const [[{ treatmentSubmitted }]] = await db.execute(
      `SELECT COUNT(*) AS treatmentSubmitted
       FROM treatment_plans tp
       JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
       WHERE d.dermatologist_id = ?
         AND tp.approved = 1`,
      [dermId]
    );

    // Cases this derm finished (diagnosis + treatment submitted) but still
    // status='treatment_ready' because the clinician hasn't reviewed and billed yet.
    // Useful for the derm to track their own throughput — NOT a billing notification.
    const [[{ awaitingClinicianReview }]] = await db.execute(
      `SELECT COUNT(*) AS awaitingClinicianReview
       FROM cases c
       JOIN diagnoses d ON d.case_id = c.case_id
       WHERE c.status = 'treatment_ready'
         AND d.dermatologist_id = ?`,
      [dermId]
    );

    // Cases fully closed by the clinician (status='completed') that were
    // handled by THIS dermatologist — their historical closed-case count
    const [[{ completedCases }]] = await db.execute(
      `SELECT COUNT(*) AS completedCases
       FROM cases c
       JOIN diagnoses d ON d.case_id = c.case_id
       WHERE c.status = 'completed'
         AND d.dermatologist_id = ?`,
      [dermId]
    );

    // The live queue of cases waiting to be reviewed —
    // ordered oldest first so the derm works FIFO
    const [pendingCases] = await db.execute(
      `SELECT
         c.case_id, c.patient_id, c.chief_complaint,
         c.lesion_location, c.image_count, c.created_at,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         u.full_name                           AS clinician_name,
         ai.predicted_label, ai.confidence_score
       FROM cases c
       JOIN patients   p  ON c.patient_id  = p.patient_id
       JOIN clinicians cl ON c.clinician_id = cl.clinician_id
       JOIN users      u  ON cl.user_id     = u.user_id
       LEFT JOIN ai_predictions ai
         ON ai.case_id = c.case_id
         AND ai.prediction_id = (
           SELECT MAX(prediction_id)
           FROM ai_predictions
           WHERE case_id = c.case_id
         )
       WHERE c.status = 'sent_to_derm'
       ORDER BY c.created_at ASC`
    );

    // Cases this derm has fully handled but are still awaiting clinician review.
    // LEFT JOIN on treatment_plans in case treatment was not yet submitted.
    // Shown as "My Completed Work" — gives derm visibility into their output
    // without involving billing
    const [awaitingReviewCases] = await db.execute(
      `SELECT
         c.case_id, c.patient_id, c.chief_complaint,
         c.lesion_location, c.created_at,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         u.full_name                           AS clinician_name,
         d.final_diagnosis,
         tp.created_at                         AS treatment_submitted_at
       FROM cases c
       JOIN patients      p  ON c.patient_id       = p.patient_id
       JOIN clinicians    cl ON c.clinician_id      = cl.clinician_id
       JOIN users         u  ON cl.user_id          = u.user_id
       JOIN diagnoses     d  ON d.case_id           = c.case_id
       LEFT JOIN treatment_plans tp ON tp.diagnosis_id = d.diagnosis_id
       WHERE c.status = 'treatment_ready'
         AND d.dermatologist_id = ?
       ORDER BY c.created_at DESC`,
      [dermId]
    );

    // Last 10 diagnoses submitted by this derm — activity feed.
    // Shows real case status so derm can see if clinician has since closed them.
    const [recentActivity] = await db.execute(
      `SELECT
         d.case_id,
         CONCAT(p.first_name,' ',p.last_name)          AS patient_name,
         CONCAT('Diagnosis — ', d.final_diagnosis)     AS action,
         d.approved_at                                  AS created_at,
         c.status                                       AS case_status
       FROM diagnoses d
       JOIN cases    c ON d.case_id    = c.case_id
       JOIN patients p ON c.patient_id = p.patient_id
       WHERE d.dermatologist_id = ?
       ORDER BY d.approved_at DESC
       LIMIT 10`,
      [dermId]
    );

    return res.json({
      stats: {
        pendingReview, // cases in queue waiting to be reviewed
        reviewedToday, // diagnoses this derm submitted today
        totalThisWeek, // total pipeline volume this week
        treatmentSubmitted, // treatment plans this derm has sent out
        awaitingClinicianReview, // cases derm is done with, clinician pending
        completedCases, // cases fully closed by the clinician
      },
      pendingCases, // list of cases in sent_to_derm queue
      awaitingReviewCases, // list of cases derm finished, awaiting clinician
      recentActivity, // last 10 diagnoses this derm submitted
    });
  } catch (err) {
    console.error("getDermatologistDashboard error:", err);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};

// ─── GET /cases/pending/count ─────────────────────────────────────────────────
// Lightweight endpoint used by the sidebar badge to show pending case count
// without loading the full dashboard
export const getPendingCaseCount = async (req, res) => {
  try {
    const [[{ count }]] = await db.execute(
      `SELECT COUNT(*) AS count FROM cases WHERE status = 'sent_to_derm'`
    );
    return res.json({ count });
  } catch (err) {
    console.error("getPendingCaseCount error:", err);
    return res.status(500).json({ message: "Failed to get count" });
  }
};

// ─── GET /cases ───────────────────────────────────────────────────────────────
// Returns cases filtered by status query param.
// Defaults to 'sent_to_derm' — the main working queue.
// Frontend can pass ?status=treatment_ready to see submitted work.
export const getDermCases = async (req, res) => {
  try {
    const { status = "sent_to_derm" } = req.query;

    const [cases] = await db.execute(
      `SELECT
         c.case_id, c.patient_id, c.chief_complaint,
         c.lesion_location, c.lesion_type, c.image_count,
         c.status, c.created_at,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         p.date_of_birth, p.sex,
         u.full_name                           AS clinician_name,
         ai.predicted_label, ai.confidence_score
       FROM cases c
       JOIN patients   p  ON c.patient_id  = p.patient_id
       JOIN clinicians cl ON c.clinician_id = cl.clinician_id
       JOIN users      u  ON cl.user_id     = u.user_id
       LEFT JOIN ai_predictions ai
         ON ai.case_id = c.case_id
         AND ai.prediction_id = (
           SELECT MAX(prediction_id) FROM ai_predictions WHERE case_id = c.case_id
         )
       WHERE c.status = ?
       ORDER BY c.created_at ASC`,
      [status]
    );

    return res.json({ cases });
  } catch (err) {
    console.error("getDermCases error:", err);
    return res.status(500).json({ message: "Failed to load cases" });
  }
};

// ─── GET /cases/:id ───────────────────────────────────────────────────────────
// Returns full case detail for the derm's review screen:
// case info, images, AI predictions, existing diagnosis/treatment,
// patient medical history, and prior cases for the same patient
export const getDermCaseById = async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    if (!Number.isInteger(caseId) || caseId <= 0)
      return res.status(400).json({ message: "Invalid case ID" });

    // Main case row with patient and clinician info joined
    const [[caseRow]] = await db.execute(
      `SELECT
         c.*,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         p.date_of_birth                       AS patient_dob,
         p.sex                                 AS patient_sex,
         p.contact_info                        AS patient_contact,
         p.occupation                          AS patient_occupation,
         u.full_name                           AS clinician_name,
         u.email                               AS clinician_email
       FROM cases c
       JOIN patients   p  ON c.patient_id  = p.patient_id
       JOIN clinicians cl ON c.clinician_id = cl.clinician_id
       JOIN users      u  ON cl.user_id     = u.user_id
       WHERE c.case_id = ?`,
      [caseId]
    );
    if (!caseRow) return res.status(404).json({ message: "Case not found" });

    const patientId = caseRow.patient_id;

    // Skin lesion images uploaded by the clinician for this case
    const [images] = await db.execute(
      `SELECT id, file_path, created_at FROM case_images
       WHERE case_id = ? ORDER BY created_at ASC`,
      [caseId]
    );

    // AI model predictions for this case — newest first
    const [aiPredictions] = await db.execute(
      `SELECT predicted_label, confidence_score, model_version, created_at
       FROM ai_predictions WHERE case_id = ?
       ORDER BY created_at DESC`,
      [caseId]
    );

    // Most recent diagnosis for this case (if one has been submitted)
    const [[diagnosis = null]] = await db.execute(
      `SELECT d.diagnosis_id, d.final_diagnosis, d.notes, d.approved_at,
              u.full_name AS dermatologist_name
       FROM diagnoses d
       JOIN dermatologists dr ON d.dermatologist_id = dr.dermatologist_id
       JOIN users          u  ON dr.user_id          = u.user_id
       WHERE d.case_id = ?
       ORDER BY d.approved_at DESC LIMIT 1`,
      [caseId]
    );

    // Most recent treatment plan for this case (if one has been submitted)
    const [[treatment = null]] = await db.execute(
      `SELECT tp.*
       FROM treatment_plans tp
       JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
       WHERE d.case_id = ?
       ORDER BY tp.created_at DESC LIMIT 1`,
      [caseId]
    );

    // Patient allergies — critical for safe prescribing in the treatment plan
    const [allergies] = await db.execute(
      `SELECT allergy_name, reaction, severity
       FROM patient_allergies
       WHERE patient_id = ? ORDER BY severity DESC`,
      [patientId]
    );

    // Patient's current medications — important to check for drug interactions
    const [medications] = await db.execute(
      `SELECT medication_name, dosage, start_date
       FROM patient_medications
       WHERE patient_id = ? ORDER BY start_date DESC`,
      [patientId]
    );

    // Patient's known medical conditions — provides clinical context
    const [conditions] = await db.execute(
      `SELECT condition_name, severity, notes, date_recorded
       FROM patient_conditions
       WHERE patient_id = ? ORDER BY date_recorded DESC`,
      [patientId]
    );

    // Previous cases for the same patient — helps the derm understand
    // history of skin conditions and prior treatments
    const [priorCases] = await db.execute(
      `SELECT
         c.case_id, c.chief_complaint, c.status, c.created_at,
         d.final_diagnosis,
         tp.medications AS treatment
       FROM cases c
       LEFT JOIN diagnoses       d  ON d.case_id       = c.case_id
       LEFT JOIN treatment_plans tp ON tp.diagnosis_id = d.diagnosis_id
       WHERE c.patient_id = ? AND c.case_id != ?
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [patientId, caseId]
    );

    return res.json({
      case: caseRow,
      images,
      aiPredictions,
      diagnosis,
      treatment,
      allergies,
      medications,
      conditions,
      priorCases,
    });
  } catch (err) {
    console.error("getDermCaseById error:", err);
    return res.status(500).json({ message: "Failed to load case" });
  }
};

// ─── POST /cases/:id/diagnose ─────────────────────────────────────────────────
// Dermatologist submits (or updates) a diagnosis for a case.
// Sets case status to 'treatment_ready' and notifies the clinician.
// The case stays 'treatment_ready' — it is NOT completed here.
// Only the clinician can mark a case completed after reviewing and billing.
export const submitDiagnosis = async (req, res) => {
  let connection;
  try {
    const caseId = Number(req.params.id);
    if (!Number.isInteger(caseId) || caseId <= 0)
      return res.status(400).json({ message: "Invalid case ID" });

    const { final_diagnosis, notes } = req.body;
    if (!final_diagnosis)
      return res.status(400).json({ message: "final_diagnosis is required" });

    const dermId = await getDermatologistId(req.user.user_id);
    if (!dermId)
      return res.status(404).json({ message: "Dermatologist not found" });

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get the case to find which clinician to notify
    const [[caseRow]] = await connection.execute(
      `SELECT clinician_id, patient_id FROM cases WHERE case_id = ?`,
      [caseId]
    );
    if (!caseRow) {
      await connection.rollback();
      return res.status(404).json({ message: "Case not found" });
    }

    // Check if a diagnosis already exists — update it if so (derm revising)
    const [[existing]] = await connection.execute(
      `SELECT diagnosis_id FROM diagnoses WHERE case_id = ? LIMIT 1`,
      [caseId]
    );

    let diagnosisId;
    if (existing) {
      // Derm is revising their diagnosis — update in place
      await connection.execute(
        `UPDATE diagnoses
         SET final_diagnosis = ?, notes = ?, approved_at = NOW()
         WHERE diagnosis_id = ?`,
        [final_diagnosis, notes || null, existing.diagnosis_id]
      );
      diagnosisId = existing.diagnosis_id;
    } else {
      // First time diagnosing this case
      const [diagResult] = await connection.execute(
        `INSERT INTO diagnoses
           (case_id, dermatologist_id, final_diagnosis, notes, approved_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [caseId, dermId, final_diagnosis, notes || null]
      );
      diagnosisId = diagResult.insertId;
    }

    // Move the case to treatment_ready so the clinician knows work has started.
    // The case stays here until the clinician closes it after billing.
    await connection.execute(
      `UPDATE cases SET status = 'treatment_ready' WHERE case_id = ?`,
      [caseId]
    );

    // Insert a notification for the clinician so it appears in their
    // notifications panel and increments their unread badge count
    const message = `Case #${caseId} diagnosed — treatment plan in progress`;
    await connection.execute(
      `INSERT INTO notifications (clinician_id, message, type)
       VALUES (?, ?, 'diagnosis_ready')`,
      [caseRow.clinician_id, message]
    );

    // Fetch the saved diagnosis to return in the response
    const [[savedDiagnosis]] = await connection.execute(
      `SELECT d.diagnosis_id, d.final_diagnosis, d.notes, d.approved_at,
              u.full_name AS dermatologist_name
       FROM diagnoses d
       JOIN dermatologists dr ON d.dermatologist_id = dr.dermatologist_id
       JOIN users          u  ON dr.user_id          = u.user_id
       WHERE d.diagnosis_id = ?`,
      [diagnosisId]
    );

    await connection.commit();

    // Emit real-time socket event to the clinician's room.
    // getIO() returns null if socket not initialised — the if-guard is safe.
    const io = getIO();
    if (io) {
      io.to(`clinician:${caseRow.clinician_id}`).emit("notification", {
        type: "diagnosis_ready",
        case_id: caseId,
        patient_id: caseRow.patient_id,
        message,
        created_at: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      message: "Diagnosis submitted successfully",
      diagnosis_id: diagnosisId,
      diagnosis: savedDiagnosis || null,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("submitDiagnosis error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to submit diagnosis" });
  } finally {
    if (connection) connection.release();
  }
};

// ─── POST /cases/:id/treatment/generate ──────────────────────────────────────
// Calls OpenAI to generate a suggested treatment plan based on the diagnosis
// and patient context. The result is returned to the frontend for the derm
// to review and edit before submitting — it is NOT saved automatically.
export const generateAITreatment = async (req, res) => {
  const { id } = req.params;
  const {
    diagnosis,
    patient_name,
    patient_age,
    patient_sex,
    lesion_location,
    symptoms,
    prior_treatment,
    allergies = [],
    current_medications = [],
  } = req.body;

  // All of these must be present — the frontend has them from the loaded case
  const missing = [];
  if (!diagnosis) missing.push("diagnosis");
  if (!patient_name) missing.push("patient_name");
  if (!patient_age) missing.push("patient_age");
  if (!patient_sex) missing.push("patient_sex");
  if (!lesion_location) missing.push("lesion_location");

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  // Flattens any GPT field value into a clean readable string.
  // GPT sometimes returns nested objects or arrays despite instructions —
  // this handles all possible shapes so the frontend textarea always
  // receives plain human-readable text.
  const formatNestedField = (val) => {
    if (typeof val === "string") return val;
    if (val == null) return "";
    if (Array.isArray(val)) {
      return val
        .map((item, i) =>
          typeof item === "string"
            ? `${i + 1}. ${item}`
            : `${i + 1}. ${Object.entries(item)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}`
        )
        .join("\n");
    }
    if (typeof val === "object") {
      return Object.entries(val)
        .map(([key, details]) => {
          if (typeof details === "object" && details !== null) {
            const parts = Object.entries(details)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return `• ${parts}`;
          }
          return `• ${key}: ${details}`;
        })
        .join("\n");
    }
    return String(val);
  };

  try {
    // Only include allergy and medication lines if data exists
    const allergyNote = allergies.length
      ? `\n- Known allergies: ${allergies.join(", ")}`
      : "";
    const medicationNote = current_medications.length
      ? `\n- Current medications: ${current_medications.join(", ")}`
      : "";

    const prompt = `
You are a board-certified dermatologist generating a structured treatment plan.

Patient:
- Name: ${patient_name}
- Age: ${patient_age}
- Sex: ${patient_sex}
- Diagnosis: ${diagnosis}
- Lesion location: ${lesion_location}
- Symptoms: ${symptoms || "Not recorded"}
- Prior treatment: ${prior_treatment || "None"}${allergyNote}${medicationNote}

Generate a structured, evidence-based treatment plan with three parts:
1. Medications — specific drug names, dosages, frequency, and duration.
   IMPORTANT: avoid drugs the patient is allergic to.
2. Lifestyle Advice — practical daily habits the patient should follow.
3. Follow-up Instructions — when to return and what warning signs to watch for.

CRITICAL RULES:
- Each JSON value must be a SINGLE flat string — no nested objects, no arrays, no sub-keys.
- Write medications as one readable paragraph or use "•" bullets within the string.
- CORRECT: "Adapalene 0.1% gel — apply once nightly for 12 weeks."
- WRONG: {"topical_retinoid": {"name": "Adapalene", "dosage": "0.1%"}}

Respond ONLY in this exact JSON format with no markdown or extra text:
{
  "medications": "...",
  "lifestyle_advice": "...",
  "follow_up_instructions": "..."
}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a clinical dermatology assistant. Always respond with valid JSON only — no markdown, no extra text. All JSON values must be plain strings, never nested objects or arrays.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    });

    const raw = completion.choices[0].message.content?.trim() || "{}";

    // Strip markdown code fences GPT sometimes adds despite instructions
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        parsed === null
      )
        throw new Error("GPT response was not a plain object");
    } catch (parseErr) {
      console.error(`[Case ${id}] generateAITreatment parse error. Raw:`, raw);
      return res.status(500).json({
        message:
          "AI returned an invalid response. Please write the treatment plan manually.",
      });
    }

    return res.json({
      medications: formatNestedField(parsed.medications),
      lifestyle_advice: formatNestedField(parsed.lifestyle_advice),
      follow_up_instructions: formatNestedField(parsed.follow_up_instructions),
      generated_by: "llm",
    });
  } catch (err) {
    console.error(`[Case ${id}] generateAITreatment error:`, err);
    return res.status(500).json({
      message:
        "AI generation failed. Please write the treatment plan manually.",
    });
  }
};

// ─── POST /cases/:id/treatment ────────────────────────────────────────────────
// Dermatologist submits the final approved treatment plan for a case.
//
// IMPORTANT — what this does NOT do:
//   ✗ Does NOT set status = 'completed'
//   ✗ Does NOT notify the derm when the clinician closes the case later
//
// The dermatologist's responsibility ends here. The case stays 'treatment_ready'
// so the clinician can review the plan, bill the patient, and then call
// POST /clinicians/cases/:id/complete to close the case.
// Billing is a clinic-internal process — the remote derm is not involved.
export const submitTreatmentPlan = async (req, res) => {
  let connection;
  try {
    const caseId = Number(req.params.id);
    if (!Number.isInteger(caseId) || caseId <= 0)
      return res.status(400).json({ message: "Invalid case ID" });

    const {
      medications,
      lifestyle_advice,
      follow_up_instructions,
      generated_by,
    } = req.body;
    if (!medications)
      return res.status(400).json({ message: "medications is required" });

    const dermId = await getDermatologistId(req.user.user_id);
    if (!dermId)
      return res.status(404).json({ message: "Dermatologist not found" });

    // Ensure generated_by matches ENUM('llm','dermatologist') — default to 'dermatologist'
    const validSources = new Set(["llm", "dermatologist"]);
    const safeGeneratedBy = validSources.has(generated_by)
      ? generated_by
      : "dermatologist";

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get the case to find which clinician to notify
    const [[caseRow]] = await connection.execute(
      `SELECT clinician_id, patient_id FROM cases WHERE case_id = ?`,
      [caseId]
    );
    if (!caseRow) {
      await connection.rollback();
      return res.status(404).json({ message: "Case not found" });
    }

    // A diagnosis must exist before a treatment plan can be submitted
    const [[diagRow]] = await connection.execute(
      `SELECT diagnosis_id FROM diagnoses
       WHERE case_id = ? ORDER BY approved_at DESC LIMIT 1`,
      [caseId]
    );
    if (!diagRow) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "No diagnosis found. Submit a diagnosis first." });
    }

    // Check if a treatment plan already exists for this case
    const [[existingTx]] = await connection.execute(
      `SELECT tp.treatment_id FROM treatment_plans tp
       JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
       WHERE d.case_id = ? LIMIT 1`,
      [caseId]
    );

    let treatmentId;
    if (existingTx) {
      // Derm is revising their treatment plan — update in place
      await connection.execute(
        `UPDATE treatment_plans
         SET medications            = ?,
             lifestyle_advice       = ?,
             follow_up_instructions = ?,
             generated_by           = ?,
             approved               = 1
         WHERE treatment_id = ?`,
        [
          medications,
          lifestyle_advice || null,
          follow_up_instructions || null,
          safeGeneratedBy,
          existingTx.treatment_id,
        ]
      );
      treatmentId = existingTx.treatment_id;
    } else {
      // First treatment plan for this case — insert new record
      const [result] = await connection.execute(
        `INSERT INTO treatment_plans
           (diagnosis_id, medications, lifestyle_advice,
            follow_up_instructions, generated_by, approved)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          diagRow.diagnosis_id,
          medications,
          lifestyle_advice || null,
          follow_up_instructions || null,
          safeGeneratedBy,
        ]
      );
      treatmentId = result.insertId;
    }

    // Case status intentionally NOT changed here.
    // It stays 'treatment_ready' — the clinician must review, bill the patient,
    // and then explicitly call POST /clinicians/cases/:id/complete to close it.
    // The dermatologist's job ends at treatment submission.

    // Notify the clinician that the full treatment plan is now available
    const message = `Case #${caseId} — diagnosis and treatment plan ready for review`;
    await connection.execute(
      `INSERT INTO notifications (clinician_id, message, type)
       VALUES (?, ?, 'treatment_ready')`,
      [caseRow.clinician_id, message]
    );

    await connection.commit();

    // Emit real-time socket event to the clinician's room.
    // getIO() returns null if socket not initialised — the if-guard is safe.
    const io = getIO();
    if (io) {
      io.to(`clinician:${caseRow.clinician_id}`).emit("notification", {
        type: "treatment_ready",
        case_id: caseId,
        patient_id: caseRow.patient_id,
        message,
        created_at: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      // Explicitly clear — case is NOT completed, awaiting clinician
      message:
        "Treatment plan submitted — awaiting clinician review and billing",
      treatment_id: treatmentId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("submitTreatmentPlan error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to submit treatment plan" });
  } finally {
    if (connection) connection.release();
  }
};

// ─── Legacy ───────────────────────────────────────────────────────────────────
// Kept for backwards compatibility — delegates to submitDiagnosis
export const completeCaseWithDiagnosis = async (req, res) => {
  return submitDiagnosis(req, res);
};

// ─── POST /cases/:id/run-ai ───────────────────────────────────────────────────
// Sends all case images to the ML server for skin lesion classification.
// Saves the best prediction (highest confidence) to ai_predictions.
// Called by the derm before diagnosing to get an AI second opinion.
export const runAIAnalysis = async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    if (!Number.isInteger(caseId) || caseId <= 0)
      return res.status(400).json({ message: "Invalid case ID" });

    const [images] = await db.execute(
      `SELECT id, file_path FROM case_images WHERE case_id = ? ORDER BY created_at ASC`,
      [caseId]
    );

    if (images.length === 0)
      return res
        .status(400)
        .json({ message: "No images uploaded for this case." });

    const ML_SERVER = process.env.ML_SERVER_URL || "http://localhost:8000";
    const BASE_URL = process.env.BASE_URL || "http://localhost:5001";
    const results = [];

    // Run each image through the ML server individually
    for (const img of images) {
      const imageUrl = `${BASE_URL}/${img.file_path}`;
      console.log("📸 Image URL sent to ML server:", imageUrl);

      try {
        const mlRes = await fetch(`${ML_SERVER}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageUrl }),
        });

        if (!mlRes.ok) {
          console.warn(
            `ML server rejected image ${img.id} with status ${mlRes.status}`
          );
          continue; // skip this image and try the next one
        }

        const prediction = await mlRes.json();
        results.push(prediction);
        console.log(
          ` Image ${img.id} → ${prediction.predicted_label} (${prediction.confidence_score}%)`
        );
      } catch (imgErr) {
        console.error(
          `Failed to reach ML server for image ${img.id}:`,
          imgErr.message
        );
      }
    }

    // If every image failed, return 502 so the frontend can show a clear error
    if (results.length === 0)
      return res.status(502).json({
        message:
          "Model server failed on all images. Check uvicorn terminal for errors.",
      });

    // Pick the prediction with the highest confidence score as the best result
    const best = results.reduce((prev, curr) =>
      curr.confidence_score > prev.confidence_score ? curr : prev
    );

    // Persist the best prediction for display on the case review page
    await db.execute(
      `INSERT INTO ai_predictions
         (case_id, predicted_label, confidence_score, model_version, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        caseId,
        best.predicted_label,
        best.confidence_score,
        process.env.MODEL_VERSION || "v1.0",
      ]
    );

    return res.status(201).json({
      message: "AI analysis complete",
      predicted_label: best.predicted_label,
      confidence_score: best.confidence_score,
      images_analysed: results.length,
    });
  } catch (err) {
    console.error("runAIAnalysis error:", err);
    return res
      .status(500)
      .json({ message: err.message || "AI analysis failed." });
  }
};
// GET /api/dermatologists/patients/:patientId/history
export const getPatientHistory = async (req, res) => {
  try {
    // ── Validate patient ID ─────────────────────────────────────────────────
    // Parse from URL param and reject anything that isn't a positive integer
    // to prevent SQL injection vectors and nonsensical queries
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId <= 0)
      return res.status(400).json({ message: "Invalid patient ID" });

    // ── Patient demographics ────────────────────────────────────────────────
    // Double-destructure [[patient]] so we get the first row directly
    // rather than an array — returns undefined if no match, triggering 404
    const [[patient]] = await db.execute(
      `SELECT p.patient_id,
                CONCAT(p.first_name,' ',p.last_name) AS full_name,
                p.date_of_birth  AS dob,
                p.sex,
                p.occupation,
                p.contact_info   AS contact,
                p.is_walkin,
                p.created_at
         FROM patients p
         WHERE p.patient_id = ?`,
      [patientId]
    );

    // Guard: return 404 if no patient row was found for this ID
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // ── Known allergies ─────────────────────────────────────────────────────
    // Ordered by severity DESC using FIELD() so severe allergies surface first —
    // important for the derm to see critical allergies before prescribing
    const [allergies] = await db.execute(
      `SELECT allergy_id, allergy_name AS allergyname, reaction, severity
         FROM patient_allergies
         WHERE patient_id = ?
         ORDER BY FIELD(severity,'severe','moderate','mild')`,
      [patientId]
    );

    // ── Current medications ─────────────────────────────────────────────────
    // Most recently started medications appear first so the derm sees
    // active prescriptions before older ones
    const [medications] = await db.execute(
      `SELECT med_id, medication_name AS medicationname, dosage, start_date AS startdate
         FROM patient_medications
         WHERE patient_id = ?
         ORDER BY start_date DESC`,
      [patientId]
    );

    // ── Past medical conditions ─────────────────────────────────────────────
    // Recorded by clinicians — most recent condition first.
    // Aliased to camelCase so the frontend interface matches without remapping
    const [conditions] = await db.execute(
      `SELECT condition_id, condition_name AS conditionname,
                severity, notes, date_recorded AS daterecorded
         FROM patient_conditions
         WHERE patient_id = ?
         ORDER BY date_recorded DESC`,
      [patientId]
    );

    // ── Full case history ───────────────────────────────────────────────────
    // Joins clinicians → users to get the referring clinician's name.
    // LEFT JOINs on diagnoses and treatment_plans so cases without a
    // diagnosis (e.g. still draft/sent_to_derm) are still returned —
    // those columns will just be NULL on the frontend.
    // Ordered newest first so the most recent case appears at the top.
    const [cases] = await db.execute(
      `SELECT c.case_id,
                c.chief_complaint,
                c.status,
                c.created_at,
                d.final_diagnosis,
                tp.medications  AS treatment,
                u.full_name     AS clinician_name
         FROM cases c
         JOIN clinicians cl  ON c.clinician_id   = cl.clinician_id
         JOIN users      u   ON cl.user_id        = u.user_id
         LEFT JOIN diagnoses      d  ON d.case_id      = c.case_id
         LEFT JOIN treatment_plans tp ON tp.diagnosis_id = d.diagnosis_id
         WHERE c.patient_id = ?
         ORDER BY c.created_at DESC`,
      [patientId]
    );

    // ── Response ────────────────────────────────────────────────────────────
    // Return all five datasets in a single response so the frontend
    // only needs one network request to populate the entire history page
    return res.json({ patient, allergies, medications, conditions, cases });
  } catch (err) {
    // Log full error server-side for debugging but return a safe
    // generic message to the client to avoid leaking DB internals
    console.error("getPatientHistory error:", err);
    return res.status(500).json({ message: "Failed to load patient history" });
  }
};

// ─── GET /patients ────────────────────────────────────────────────────────────
// Returns all patients ever seen, with aggregated stats for the left panel
// of the Patient Registry page (total cases, last case, allergy count)
export const getPatientList = async (req, res) => {
  try {
    const [patients] = await db.execute(
      `SELECT
           p.patient_id,
           CONCAT(p.first_name,' ',p.last_name)  AS full_name,
           p.date_of_birth                        AS dob,
           p.sex,
           p.contact_info                         AS contact,
           p.is_walkin,
           COUNT(DISTINCT c.case_id)              AS total_cases,
           MAX(c.created_at)                      AS last_case_date,
           (
             SELECT d2.final_diagnosis
             FROM cases c2
             LEFT JOIN diagnoses d2 ON d2.case_id = c2.case_id
             WHERE c2.patient_id = p.patient_id
               AND d2.final_diagnosis IS NOT NULL
             ORDER BY c2.created_at DESC
             LIMIT 1
           )                                      AS latest_diagnosis,
           COUNT(DISTINCT a.allergy_id)           AS allergy_count,
           MAX(
             CASE WHEN c.status IN ('sent_to_derm','treatment_ready')
             THEN 1 ELSE 0 END
           )                                      AS has_active_case
         FROM patients p
         LEFT JOIN cases            c ON c.patient_id  = p.patient_id
         LEFT JOIN patient_allergies a ON a.patient_id  = p.patient_id
         GROUP BY p.patient_id
         ORDER BY last_case_date DESC`
    );

    return res.json({ patients });
  } catch (err) {
    console.error("getPatientList error:", err);
    return res.status(500).json({ message: "Failed to load patient list" });
  }
};
// GET /notifications
export const getNotifications = async (req, res) => {
    try {
      const dermId = await getDermatologistId(req.user.user_id);
      if (!dermId) return res.status(404).json({ message: "Not found" });
      const [notifications] = await db.execute(
        `SELECT notification_id, message, type, is_read, case_id, created_at
         FROM derm_notifications
         WHERE dermatologist_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [dermId]
      );
      res.json({ notifications });
    } catch (err) {
      res.status(500).json({ message: "Failed to load notifications" });
    }
  };
  
  // GET /notifications/unread/count
  export const getUnreadCount = async (req, res) => {
    try {
      const dermId = await getDermatologistId(req.user.user_id);
      const [[{ count }]] = await db.execute(
        `SELECT COUNT(*) AS count FROM derm_notifications
         WHERE dermatologist_id = ? AND is_read = 0`,
        [dermId]
      );
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: "Failed to get count" });
    }
  };
  
  // PATCH /notifications/:id/read
  export const markNotificationRead = async (req, res) => {
    try {
      const dermId = await getDermatologistId(req.user.user_id);
      await db.execute(
        `UPDATE derm_notifications SET is_read = 1
         WHERE notification_id = ? AND dermatologist_id = ?`,
        [req.params.id, dermId]
      );
      res.json({ message: "Marked as read" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update" });
    }
  };
  
  // PATCH /notifications/read-all
  export const markAllNotificationsRead = async (req, res) => {
    try {
      const dermId = await getDermatologistId(req.user.user_id);
      await db.execute(
        `UPDATE derm_notifications SET is_read = 1 WHERE dermatologist_id = ?`,
        [dermId]
      );
      res.json({ message: "All marked as read" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update" });
    }
  };

  // ─── GET /profile/stats ───────────────────────────────────────────────────────
export const getProfileStats = async (req, res) => {
    try {
      const dermId = await getDermatologistId(req.user.user_id);
      if (!dermId)
        return res.status(404).json({ message: "Dermatologist not found" });
  
      // Run all stat queries in parallel for speed
      const [
        [[{ totalReviewed }]],
        [[{ diagnosesSubmitted }]],
        [[{ treatmentsSubmitted }]],
        [[{ completedCases }]],
        [[{ pendingReview }]],
        [[{ reviewedToday }]],
      ] = await Promise.all([
  
        // Total unique cases this derm has ever reviewed
        db.execute(
          `SELECT COUNT(DISTINCT case_id) AS totalReviewed
           FROM diagnoses WHERE dermatologist_id = ?`,
          [dermId]
        ),
  
        // Total diagnoses submitted (same case revised = counts once per submit)
        db.execute(
          `SELECT COUNT(*) AS diagnosesSubmitted
           FROM diagnoses WHERE dermatologist_id = ?`,
          [dermId]
        ),
  
        // Total treatment plans this derm has sent out
        db.execute(
          `SELECT COUNT(*) AS treatmentsSubmitted
           FROM treatment_plans tp
           JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
           WHERE d.dermatologist_id = ?`,
          [dermId]
        ),
  
        // Cases fully closed by the clinician that this derm handled
        db.execute(
          `SELECT COUNT(*) AS completedCases
           FROM cases c
           JOIN diagnoses d ON d.case_id = c.case_id
           WHERE c.status = 'completed'
             AND d.dermatologist_id = ?`,
          [dermId]
        ),
  
        // Global queue — cases waiting for ANY derm to review
        db.execute(
          `SELECT COUNT(*) AS pendingReview
           FROM cases WHERE status = 'sent_to_derm'`
        ),
  
        // Diagnoses this derm submitted today
        db.execute(
          `SELECT COUNT(*) AS reviewedToday
           FROM diagnoses
           WHERE dermatologist_id = ?
             AND DATE(approved_at) = CURDATE()`,
          [dermId]
        ),
      ]);
  
      return res.json({
        totalReviewed,
        diagnosesSubmitted,
        treatmentsSubmitted,
        completedCases,
        pendingReview,
        reviewedToday,
      });
    } catch (err) {
      console.error("getProfileStats error:", err);
      return res.status(500).json({ message: "Failed to load stats" });
    }
  };
  
  
  // ─── PUT /profile  , derma profile update, only name, specialization and experience can be updated, not email or password
  export const updateProfile = async (req, res) => {
    try {
      const { fullName, specialization, yearsExperience } = req.body;
  
      if (!fullName?.trim())
        return res.status(400).json({ message: "Full name is required" });
  
      // Update display name in users table
      await db.execute(
        `UPDATE users SET full_name = ? WHERE user_id = ?`,
        [fullName.trim(), req.user.user_id]
      );
  
      // Update specialization and experience in dermatologists table
      await db.execute(
        `UPDATE dermatologists
         SET specialization   = ?,
             years_experience = ?
         WHERE user_id = ?`,
        [
          specialization?.trim() || "Dermatologist",
          Number(yearsExperience) || 0,
          req.user.user_id,
        ]
      );
  
      return res.json({ message: "Profile updated successfully" });
    } catch (err) {
      console.error("updateProfile error:", err);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  };
  
  
  // ─── PUT /profile/password ────────────────────────────────────────────────────
  export const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
  
      if (!currentPassword || !newPassword)
        return res.status(400).json({ message: "Both fields are required" });
  
      if (newPassword.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters" });
  
      // Fetch the stored hash
      const [[user]] = await db.execute(
        `SELECT password_hash FROM users WHERE user_id = ?`,
        [req.user.user_id]
      );
      if (!user)
        return res.status(404).json({ message: "User not found" });
  
      // Verify current password against stored hash
      const bcrypt = await import("bcryptjs");
      const valid  = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid)
        return res.status(401).json({ message: "Current password is incorrect" });
  
      // Hash and save the new password
      const hash = await bcrypt.hash(newPassword, 10);
      await db.execute(
        `UPDATE users SET password_hash = ? WHERE user_id = ?`,
        [hash, req.user.user_id]
      );
  
      return res.json({ message: "Password changed successfully" });
    } catch (err) {
      console.error("changePassword error:", err);
      return res.status(500).json({ message: "Failed to change password" });
    }
  };
  

  
