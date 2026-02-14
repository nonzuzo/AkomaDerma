import db from '../config/db.js';

export const getClinicianAppointments = async (req, res) => {
  try {
    const { filter } = req.query;
    const userId = req.user.user_id;
    
    const [clinicians] = await db.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?", [userId]
    );
    
    if (clinicians.length === 0) {
      return res.json([]); // Empty array instead of error
    }
    
    const clinicianId = clinicians[0].clinician_id;
    
    let whereClause = "WHERE a.clinician_id = ?";
    let params = [clinicianId];
    
    // FIXED TODAY FILTER
    if (filter === 'today') {
      whereClause += " AND DATE(a.appointment_date) = CURDATE()";
    } else if (filter === 'week') {
      whereClause += " AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }
    // 'all' shows everything for clinician_id = 1
    
    console.log('Query:', whereClause, 'Params:', params); // DEBUG
    
    const [appointments] = await db.execute(`
      SELECT 
        a.appointment_id,
        a.appointment_date as appointment_time,
        a.status,
        a.notes,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.patient_id as pid,
        p.contact_info as phone,
        COALESCE(ps.summary_text, 'New patient') as ai_summary
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN patient_summaries ps ON p.patient_id = ps.patient_id
      ${whereClause}
      ORDER BY a.appointment_date ASC
    `, params);
    
    console.log('Found appointments:', appointments.length); // DEBUG
    res.json(appointments);
  } catch (error) {
    console.error('Appointments error:', error);
    res.json([]); // Always return array, never error
  }
};
// the modal to create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const { patient_id, appointment_date, notes } = req.body;
    const userId = req.user.user_id;
    
    // Get clinician_id
    const [clinicians] = await db.execute(
      'SELECT clinician_id FROM clinicians WHERE user_id = ?', [userId]
    );
    if (clinicians.length === 0) {
      return res.status(400).json({ error: 'Clinician not found' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO appointments (patient_id, clinician_id, appointment_date, notes, status) 
       VALUES (?, ?, ?, ?, 'booked')`,
      [patient_id, clinicians[0].clinician_id, appointment_date, notes]
    );
    
    console.log('Created appointment:', result.insertId);
    res.json({ success: true, appointment_id: result.insertId });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};
