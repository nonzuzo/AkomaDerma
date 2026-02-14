// models/Patient.js - Add this method to your existing model
import db from '../config/db.js';

export class Patient {
  static async findClinicianPatients(clinicianId, query) {
    const [results] = await db.execute(`
      SELECT patient_id, first_name, last_name, date_of_birth, contact_info, is_walkin
      FROM patients 
      WHERE clinician_id = ? 
      AND (
        patient_id LIKE ? 
        OR first_name LIKE ? 
        OR last_name LIKE ? 
        OR CONCAT(first_name, ' ', last_name) LIKE ?
      )
      ORDER BY created_at DESC 
      LIMIT 10
    `, [clinicianId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
    
    return results;
  }
}

export default Patient;
