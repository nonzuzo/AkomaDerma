// middleware/authMiddleware.js - JWT TOKEN VALIDATION
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database (users table)
    const [users] = await pool.execute(
      "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid token - user not found" });
    }

    // Attach user to req for controllers
    req.user = {
      user_id: users[0].user_id,
      full_name: users[0].full_name,
      email: users[0].email,
      role: users[0].role,
    };

    // Check if clinician has profile in clinicians table
    const [clinicians] = await pool.execute(
      "SELECT clinician_id FROM clinicians WHERE user_id = ?",
      [decoded.user_id]
    );

    if (clinicians.length > 0) {
      req.user.clinician_id = clinicians[0].clinician_id;
    }

    // ADD THIS DEBUG LOG
    console.log("Auth passed - User:", req.user);

    next();
  } catch (error) {
    console.error(" Auth middleware error:", error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Simple version - just verify token (for public routes if needed)
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { user_id: decoded.user_id };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
