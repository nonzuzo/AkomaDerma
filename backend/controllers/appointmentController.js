// controllers/appointmentController.js
import db from "../config/db.js";
import OpenAI from "openai";

// Lazy init — only crashes when AI is actually called, not on server startup
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const summaryCache = new Map();

// ─── GET /api/clinician/appointments ─────────────────────────────────────────
export const getClinicianAppointments = async (req, res) => {
  try {
    const { filter } = req.query;
    const userId = req.user.user_id;

    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [userId]
    );
    if (clinicians.length === 0) return res.json([]);
    const clinicianId = clinicians[0].clinician_id;

    let whereClause = "WHERE a.clinician_id = ?";
    const params = [clinicianId];
    if (filter === "today") {
      whereClause += " AND DATE(a.appointment_date) = CURDATE()";
    } else if (filter === "week") {
      whereClause +=
        " AND a.appointment_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)";
    }

    const [appointments] = await db.execute(
      `SELECT
         a.appointment_id,
         a.appointment_date      AS appointment_time,
         a.status,
         a.notes,
         a.reason_for_visit,
         a.checked_in_at,
         a.completed_at,
         a.cancelled_at,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         p.patient_id            AS pid,
         p.contact_info          AS phone,
         p.sex,
         p.date_of_birth,
         (SELECT COUNT(*) FROM cases c
          WHERE c.patient_id = p.patient_id)                        AS total_cases,
         (SELECT d.final_diagnosis
          FROM diagnoses d JOIN cases c ON d.case_id = c.case_id
          WHERE c.patient_id = p.patient_id
          ORDER BY d.approved_at DESC LIMIT 1)                      AS last_diagnosis,
         (SELECT tp.medications
          FROM treatment_plans tp
          JOIN diagnoses d ON tp.diagnosis_id = d.diagnosis_id
          JOIN cases c     ON d.case_id       = c.case_id
          WHERE c.patient_id = p.patient_id AND tp.approved = 1
          ORDER BY tp.created_at DESC LIMIT 1)                      AS last_treatment,
         (SELECT CONCAT(pc.condition_name, ' (', pc.severity, ')')
          FROM patient_conditions pc
          WHERE pc.patient_id = p.patient_id
          ORDER BY pc.date_recorded DESC LIMIT 1)                   AS latest_condition,
         (SELECT c.status
          FROM cases c
          WHERE c.patient_id = p.patient_id
            AND c.status IN ('sent_to_derm','treatment_ready')
          ORDER BY c.created_at DESC LIMIT 1)                       AS open_case_status
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       ${whereClause}
       ORDER BY a.appointment_date ASC`,
      params
    );

    // AI summaries run in parallel but never crash the whole response
    const enriched = await Promise.all(
      appointments.map(async (appt) => ({
        ...appt,
        ai_summary: await generateAISummary(appt),
      }))
    );

    res.json(enriched);
  } catch (error) {
    // Return actual error instead of silent [] — helps debugging
    console.error("Appointments error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─── OpenAI 2-sentence card summary ──────────────────────────────────────────
async function generateAISummary(appt) {
  const cacheKey = `appt_${appt.appointment_id}`;
  if (summaryCache.has(cacheKey)) return summaryCache.get(cacheKey);

  const age = appt.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(appt.date_of_birth).getTime()) / 3.156e10
      )
    : null;

  const context = {
    patient: appt.patient_name,
    ...(age && { age: `${age} years old` }),
    ...(appt.sex && { sex: appt.sex }),
    visit_type:
      appt.total_cases > 0
        ? `Return patient (${appt.total_cases} prior visit${
            appt.total_cases > 1 ? "s" : ""
          })`
        : "New patient — first visit",
    ...(appt.last_diagnosis && { last_diagnosis: appt.last_diagnosis }),
    ...(appt.last_treatment && { last_treatment: appt.last_treatment }),
    ...(appt.latest_condition && { latest_condition: appt.latest_condition }),
    ...(appt.open_case_status && { open_case_status: appt.open_case_status }),
    ...(appt.reason_for_visit && { reason_for_visit: appt.reason_for_visit }),
  };

  try {
    // getOpenAI() called here — not at module load time becasen OpenAI client throws if API key is missing, and we don't want that to crash the whole appointments page on startup
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      max_tokens: 80,
      messages: [
        {
          role: "system",
          content:
            "You are a clinical assistant preparing a clinician for a patient appointment. " +
            "Write exactly 2 short sentences — no more. " +
            "Sentence 1: summarise the patient's relevant medical history or diagnosis. " +
            "Sentence 2: state the single most critical thing to address or watch out for today. " +
            "Be concise, clinical and direct. No greetings, no filler.",
        },
        {
          role: "user",
          content: `Patient data:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const summary =
      response.choices[0]?.message?.content?.trim() ?? fallbackSummary(appt);
    summaryCache.set(cacheKey, summary);
    return summary;
  } catch (err) {
    console.error("OpenAI summary error:", appt.patient_name, err.message);
    return fallbackSummary(appt); // never crash the appointments page
  }
}

// ─── Fallback if OpenAI is unavailable ───────────────────────────────────────
function fallbackSummary(appt) {
  const { total_cases, last_diagnosis, reason_for_visit } = appt;
  if (!total_cases || total_cases === 0)
    return `New patient — no prior visit history. ${
      reason_for_visit
        ? `Presenting with: ${reason_for_visit}.`
        : "Reason for visit not recorded."
    }`;
  if (last_diagnosis)
    return `Return patient — previously diagnosed with ${last_diagnosis}. ${
      reason_for_visit
        ? `Today: ${reason_for_visit}.`
        : "Review prior case history."
    }`;
  return `Return patient with ${total_cases} prior visit(s). ${
    reason_for_visit
      ? `Presenting with: ${reason_for_visit}.`
      : "No active diagnosis on record."
  }`;
}

// ─── POST /api/clinician/appointments/new-patient ────────────────────────────
export const createAppointmentForNewPatient = async (req, res) => {
  try {
    const {
      first_name, last_name, date_of_birth, sex,
      contact_info, appointment_date, notes,
      reason_for_visit, is_walkin = true,
    } = req.body;

    if (!first_name || !last_name || !appointment_date)
      return res.status(400).json({ error: "First name, last name and appointment date are required" });

    if (new Date(appointment_date) < new Date())
      return res.status(400).json({ error: "Cannot book appointments in the past" });

    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [req.user.user_id]
    );
    if (clinicians.length === 0)
      return res.status(400).json({ error: "Clinician not found" });
    const clinicianId = clinicians[0].clinician_id;

    const [existingSlot] = await db.execute(
      `SELECT appointment_id FROM appointments
       WHERE clinician_id = ?
         AND status NOT IN ('cancelled','completed','no_show')
         AND ABS(TIMESTAMPDIFF(MINUTE, appointment_date, ?)) < 30
       LIMIT 1`,
      [clinicianId, appointment_date]
    );
    if (existingSlot.length > 0)
      return res.status(409).json({ error: "This time slot is already booked. Please choose a time at least 30 minutes apart." });

    const [patientResult] = await db.execute(
      `INSERT INTO patients
         (first_name, last_name, date_of_birth, sex, contact_info, clinician_id, is_walkin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, date_of_birth || null, sex || null, contact_info || null, clinicianId, is_walkin ? 1 : 0]
    );

    const [apptResult] = await db.execute(
      `INSERT INTO appointments
         (patient_id, clinician_id, appointment_date, notes, reason_for_visit, status)
       VALUES (?, ?, ?, ?, ?, 'booked')`,
      [patientResult.insertId, clinicianId, appointment_date, notes || null, reason_for_visit || null]
    );

    return res.json({ success: true, appointment_id: apptResult.insertId, patient_id: patientResult.insertId });
  } catch (error) {
    console.error("Create new patient appointment error:", error);
    return res.status(500).json({ error: error.message || "Failed to create appointment" });
  }
};

// ─── POST /api/clinician/appointments/existing-patient ───────────────────────
export const createAppointmentForExistingPatient = async (req, res) => {
  try {
    const { patient_id, appointment_date, notes, reason_for_visit } = req.body;

    if (!patient_id || !appointment_date)
      return res.status(400).json({ error: "Patient ID and appointment date are required" });

    if (new Date(appointment_date) < new Date())
      return res.status(400).json({ error: "Cannot book appointments in the past" });

    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [req.user.user_id]
    );
    if (clinicians.length === 0)
      return res.status(400).json({ error: "Clinician not found" });
    const clinicianId = clinicians[0].clinician_id;

    const [patients] = await db.execute(
      "SELECT patient_id FROM patients WHERE patient_id = ? AND clinician_id = ?",
      [patient_id, clinicianId]
    );
    if (patients.length === 0)
      return res.status(404).json({ error: "Patient not found under your account" });

    const [existingSlot] = await db.execute(
      `SELECT appointment_id FROM appointments
       WHERE clinician_id = ?
         AND status NOT IN ('cancelled','completed','no_show')
         AND ABS(TIMESTAMPDIFF(MINUTE, appointment_date, ?)) < 30
       LIMIT 1`,
      [clinicianId, appointment_date]
    );
    if (existingSlot.length > 0)
      return res.status(409).json({ error: "This time slot is already booked. Please choose a time at least 30 minutes apart." });

    const [apptResult] = await db.execute(
      `INSERT INTO appointments
         (patient_id, clinician_id, appointment_date, notes, reason_for_visit, status)
       VALUES (?, ?, ?, ?, ?, 'booked')`,
      [patient_id, clinicianId, appointment_date, notes || null, reason_for_visit || null]
    );

    return res.json({ success: true, appointment_id: apptResult.insertId, patient_id });
  } catch (error) {
    console.error("Create existing patient appointment error:", error);
    return res.status(500).json({ error: error.message || "Failed to create appointment" });
  }
};

// ─── PATCH /api/clinician/appointments/:id/status ────────────────────────────
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = ["booked", "checked_in", "completed", "cancelled", "no_show"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: "Invalid status value" });

    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [req.user.user_id]
    );
    if (clinicians.length === 0)
      return res.status(400).json({ error: "Clinician not found" });
    const clinicianId = clinicians[0].clinician_id;

    let timestampField = "";
    if (status === "checked_in") timestampField = ", checked_in_at = NOW()";
    if (status === "completed")  timestampField = ", completed_at  = NOW()";
    if (status === "cancelled")  timestampField = ", cancelled_at  = NOW()";

    const [result] = await db.execute(
      `UPDATE appointments
       SET status = ? ${timestampField}
       WHERE appointment_id = ? AND clinician_id = ?`,
      [status, id, clinicianId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Appointment not found" });

    summaryCache.delete(`appt_${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update appointment status" });
  }
};

// ─── PATCH /api/clinician/appointments/:id/reschedule ────────────────────────
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id }               = req.params;
    const { appointment_date } = req.body;

    if (!appointment_date)
      return res.status(400).json({ error: "New appointment date is required" });

    if (new Date(appointment_date) < new Date())
      return res.status(400).json({ error: "Cannot reschedule to a past date" });

    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [req.user.user_id]
    );
    if (clinicians.length === 0)
      return res.status(400).json({ error: "Clinician not found" });
    const clinicianId = clinicians[0].clinician_id;

    const [existingSlot] = await db.execute(
      `SELECT appointment_id FROM appointments
       WHERE clinician_id = ?
         AND appointment_id != ?
         AND status NOT IN ('cancelled','completed','no_show')
         AND ABS(TIMESTAMPDIFF(MINUTE, appointment_date, ?)) < 30
       LIMIT 1`,
      [clinicianId, id, appointment_date]
    );
    if (existingSlot.length > 0)
      return res.status(409).json({ error: "This time slot is already booked. Please choose a time at least 30 minutes apart." });

    const [result] = await db.execute(
      `UPDATE appointments
       SET appointment_date = ?, status = 'booked'
       WHERE appointment_id = ? AND clinician_id = ?`,
      [appointment_date, id, clinicianId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Appointment not found" });

    summaryCache.delete(`appt_${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Reschedule error:", error);
    res.status(500).json({ error: "Failed to reschedule appointment" });
  }
};
