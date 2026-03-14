// utils/analytics.js
import pool from "../config/db.js";

export async function logEvent({
  userId = null,
  caseId = null,
  eventType,
  detail = null,
}) {
  try {
    await pool.execute(
      `
      INSERT INTO analytics_events (user_id, case_id, event_type, event_detail)
      VALUES (?, ?, ?, ?)
      `,
      [userId, caseId, eventType, detail ? JSON.stringify(detail) : null]
    );
  } catch (err) {
    console.error("Analytics log error:", err.message || err);
  }
}
