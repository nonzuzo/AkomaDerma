import db from "../config/db.js";

// controllers/clinicianController.js -
export const getDashboardStats = async (req, res) => {
  console.log("getClinicianProfile called, user_id:", req.user?.user_id);
  try {
    const userId = req.user.user_id; // From clinicians table

    // Get clinician_id first (like other functions do)
    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [userId]
    );
    if (clinicians.length === 0) {
      return res.status(404).json({ error: "Clinician profile not found" });
    }

    const clinicianId = clinicians[0].clinician_id;

    // Appointments Today- appointments table)
    const [appointments] = await db.execute(
      `SELECT COUNT(*) as count 
         FROM appointments a
         WHERE DATE(a.appointment_date) = CURDATE() 
         AND a.clinician_id = ? 
         AND a.status IN ('booked', 'checked_in')`,
      [clinicianId]
    );

    // Walk-ins (patients.is_walkin if you add, or new arrivals)
    const [walkins] = await db.execute(
      `SELECT COUNT(*) as count 
         FROM patients p 
         JOIN cases c ON p.patient_id = c.patient_id
         WHERE DATE(c.created_at) = CURDATE() 
         AND c.clinician_id = ?`,
      [clinicianId]
    );

    // Case Stats (YOUR cases table)
    const [caseStats] = await db.execute(
      `SELECT 
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as casesCreatedToday,
          SUM(CASE WHEN status = 'sent_to_derm' OR status IS NULL THEN 1 ELSE 0 END) as sentToDerm,
          COUNT(*) as totalCases
         FROM cases 
         WHERE clinician_id = ?`,
      [clinicianId]
    );

    // Notifications (patient_summaries + diagnoses)...!!!! to be changed
    const notifications = [
      "Case #1: John oe - Chronic arm rash (Draft)",
      "Case #2: Jane Smth - Acne sent to dermatology",
      "Case #3: Mike Johnson - Scalp treatment ready",
      "Case #4: Sarah Wilson - Eczema completed",
    ];

    res.json({
      stats: {
        appointmentsToday: appointments[0].count,
        walkInQueue: walkins[0].count,
        casesCreatedToday: caseStats[0].casesCreatedToday || 0,
        sentToDerm: caseStats[0].sentToDerm || 0,
        treatmentReady: 2, // diagnoses joined later
        completedCases: caseStats[0].totalCases || 0,
      },
      notifications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// NEW: Get clinician profile for header (name, clinician_id, clinic)
export const getClinicianProfile = async (req, res) => {
  try {
    // req.user.user_id should come from your auth middleware (decoded JWT)
    const userId = req.user.user_id;

    // Get user row
    const [users] = await db.execute(
      "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    if (user.role !== "clinician") {
      return res.status(403).json({ error: "User is not a clinician" });
    }

    // Get clinician row
    const [clinicians] = await db.execute(
      "SELECT clinician_id, clinic_name FROM clinicians WHERE user_id = ?",
      [userId]
    );

    if (clinicians.length === 0) {
      return res.status(404).json({ error: "Clinician profile not found" });
    }

    const clinician = clinicians[0];

    // Response used by the layout header
    res.json({
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      clinicianId: clinician.clinician_id,
      clinicName: clinician.clinic_name || "Rabito Clinic",
    });
  } catch (error) {
    console.error("getClinicianProfile error:", error);
    res.status(500).json({ error: "Failed to load clinician profile" });
  }
};

// Get notification count for header bell
export const getNotificationCount = async (req, res) => {
  try {
    // Same assumption: req.user.user_id exists from auth middleware!!!!!!!!!!!!!!!!!!!!!
    const userId = req.user.user_id;

    // Map user → clinician_id
    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [userId]
    );

    if (clinicians.length === 0) {
      return res.json({ unreadCount: 0 });
    }

    const clinicianId = clinicians[0].clinician_id;

    // Count cases for this clinician that should show as notifications
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS unreadCount
       FROM cases
       WHERE clinician_id = ?
       AND status IN ('sent_to_derm', 'treatment_ready')`,
      [clinicianId]
    );

    res.json({ unreadCount: rows[0].unreadCount || 0 });
  } catch (error) {
    console.error("getNotificationCount error:", error);
    res.status(500).json({ error: "Failed to load notifications" });
  }
};
