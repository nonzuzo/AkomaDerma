/**
 * Telederma Authentication Controller v2.0
 * Complete auth flow: Signup → Admin Approval → Gmail Passcode → Verify → Login
 * Production-ready with Gmail SMTP, JWT, bcrypt, MySQL
 * Auto-redirect support via /status endpoint
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config(); // Load .env variables (GMAIL_USER, GMAIL_PASS, JWT_SECRET)

/**
 * Gmail SMTP Transport - Sends real emails to users
 * Uses App Password (16-char code from Google Account)
 */
const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // nonzuzo.sikhosana@ashesi.edu.gh
    pass: process.env.GMAIL_PASS, // Your 16-char app password
  },
});

/**
 * Generate secure 6-digit passcode (100000-999999)
 * @returns {string} 6-digit passcode
 */
const generatePasscode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 1. USER SIGNUP - Creates pending user (is_approved=0)
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { full_name, email, role, password } = req.body;
    console.log(" Signup payload:", req.body);

    // Input validation
    if (!full_name || !email || !role || !password) {
      return res.status(400).json({
        error: "Missing required fields: full_name, email, role, password",
      });
    }

    // Check if email exists
    const [existing] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password (bcrypt, 10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert pending user
    const [result] = await pool.execute(
      "INSERT INTO users (full_name, email, role, password_hash, is_approved, created_at) VALUES (?, ?, ?, ?, 0, NOW())",
      [full_name, email, role, hashedPassword]
    );

    console.log(` User created (ID: ${result.insertId}) - Awaiting approval`);
    res.status(201).json({
      success: true,
      message: "User created! Awaiting admin approval.",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error(" Signup error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 2. USER LOGIN - Requires approval + passcode verification
 * Only users with is_approved=1 AND passcode=NULL can login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(" Login attempt:", email);

    // CRITICAL: Check approved AND passcode verified
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND is_approved = 1 AND passcode IS NULL",
      [email]
    );

    if (users.length === 0) {
      console.log(" Login blocked - pending approval or needs passcode");
      return res.status(401).json({
        error:
          "Invalid credentials, account not approved, or passcode not verified!",
      });
    }

    const user = users[0];

    // Verify password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      console.log(" Invalid password");
      return res.status(401).json({ error: "Invalid password" });
    }
    // AUTO-CREATE CLINICIAN RECORD for new clinicians
    if (user.role === "clinician") {
      const [clinician] = await pool.execute(
        "SELECT clinician_id FROM clinicians WHERE user_id = ?",
        [user.user_id]
      );

      // Create if missing
      if (clinician.length === 0) {
        await pool.execute(
          "INSERT INTO clinicians (user_id, clinic_name, created_at) VALUES (?, ?, NOW())",
          [user.user_id, "Rabito Clinic"]
        );
        console.log(`Auto-created clinician record for user ${user.user_id}`);
      }
    }

    // Generate JWT (user_id payload)
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // 7 days
    });

    console.log(" Login success:", user.full_name);
    res.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(" Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 3. ADMIN: Get pending users list
 * GET /api/auth/pending-users
 */
export const getPendingUsers = async (req, res) => {
  try {
    const [pending] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role, u.created_at 
       FROM users u 
       WHERE u.is_approved = 0 ORDER BY u.created_at DESC`
    );

    console.log(` Found ${pending.length} pending users`);
    res.json(pending);
  } catch (error) {
    console.error(" Pending users error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 4. ADMIN: Approve user + send Gmail passcode
 * POST /api/auth/approve/:userId
 */
export const approveUser = async (req, res) => {
  try {
    console.log(" START approveUser userId:", req.params.userId);
    const userId = req.params.userId;
    const passcode = generatePasscode();

    console.log(" Generated passcode:", passcode);

    // Verify user exists
    const [userCheck] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update: approved + set passcode (24hr expiry)
    await pool.execute(
      "UPDATE users SET is_approved = 1, passcode = ?, passcode_expires_at = ? WHERE user_id = ?",
      [passcode, new Date(Date.now() + 24 * 60 * 60 * 1000), userId]
    );

    // Get user email/name
    const [user] = await pool.execute(
      "SELECT email, full_name FROM users WHERE user_id = ?",
      [userId]
    );
    console.log(" Sending to:", user[0].email);

    if (!user[0]?.email) {
      return res.status(500).json({ error: "User email not found" });
    }

    // SEND REAL GMAIL
    await transport.sendMail({
      from: `"AkomaDerma " <${process.env.GMAIL_USER}>`, // Use your Gmail
      to: user[0].email,
      subject: " Telederma Account Approved - Your Passcode",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Welcome ${user[0].full_name}!</h2>
          <p>Your Telederma account has been <strong>approved</strong> by admin.</p>
          <p>Use this <strong>6-digit verification passcode</strong>:</p>
          <h1 style="background: #007bff; color: white; text-align: center; padding: 20px; font-size: 2em;">${passcode}</h1>
          <p style="color: #666;"><em>Valid for 24 hours. Enter at app login screen.</em></p>
          <hr style="border: none; border-top: 1px solid #eee;">
          <p>Best regards,<br><strong>Telederma Team</strong></p>
        </div>
      `,
    });

    console.log(" Email sent successfully to", user[0].email);
    res.json({
      success: true,
      message: `User approved! Passcode sent to ${user[0].email}`,
    });
  } catch (error) {
    console.error(" approveUser ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 5. USER: Verify passcode (clears passcode field)
 * POST /api/auth/verify-passcode
 */
export const verifyPasscode = async (req, res) => {
  try {
    const { email, passcode } = req.body;
    console.log(" Verifying passcode for:", email);

    // Validate passcode (must match + not expired)
    const [users] = await pool.execute(
      `SELECT * FROM users 
       WHERE email = ? AND passcode = ? AND is_approved = 1 
       AND passcode_expires_at > NOW()`,
      [email, passcode]
    );

    if (users.length === 0) {
      console.log(" Invalid/expired passcode");
      return res.status(400).json({ error: "Invalid or expired passcode!" });
    }

    // Clear passcode - user can now login
    await pool.execute(
      "UPDATE users SET passcode = NULL, passcode_expires_at = NULL WHERE email = ?",
      [email]
    );

    console.log(" Passcode verified for:", email);
    res.json({
      success: true,
      message: "Account verified! You can now login.",
    });
  } catch (error) {
    console.error(" Verify passcode error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 6. STATUS CHECK - For frontend auto-redirect logic
 * Returns exact user state: not_registered | pending_approval | needs_passcode | ready_to_login
 * POST /api/auth/status
 */
export const getAuthStatus = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(" Status check for:", email);

    const [user] = await pool.execute(
      `SELECT is_approved, 
              CASE WHEN passcode IS NOT NULL AND passcode_expires_at > NOW() 
                   THEN 1 ELSE 0 END as needs_passcode 
       FROM users WHERE email = ?`,
      [email]
    );

    // Not registered
    if (user.length === 0) {
      return res.json({
        status: "not_registered",
        message: "Please sign up first",
      });
    }

    // Pending admin approval
    if (user[0].is_approved === 0) {
      return res.json({
        status: "pending_approval",
        message:
          "Awaiting admin approval. You will receive an email when approved.",
      });
    }

    // Needs passcode verification
    if (user[0].needs_passcode) {
      return res.json({
        status: "needs_passcode",
        message: "Check your email for 6-digit verification passcode",
      });
    }

    //  Ready to login
    res.json({
      status: "ready_to_login",
      message: "Account fully verified and ready",
    });
  } catch (error) {
    console.error(" Status check error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 7. TOKEN VERIFY - For protected routes + clinician dashboard
 * GET /api/auth/verify
 */
export const verifyToken = async (req, res) => {
  try {
    const userId = req.user.user_id; // From auth middleware
    console.log(" Verifying token for user:", userId);

    const [user] = await pool.execute(
      "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    // Clinician details (if applicable)
    let clinicianData = null;
    if (user[0].role === "clinician") {
      const [clinician] = await pool.execute(
        "SELECT clinician_id, clinic_name FROM clinicians WHERE user_id = ?",
        [userId]
      );
      clinicianData = clinician[0];
    }

    res.json({
      fullName: user[0].full_name,
      name: user[0].full_name.split(" ")[0],
      clinicianId: clinicianData?.clinician_id || "N/A",
      clinicName: clinicianData?.clinic_name || "Rabito Clinic",
      email: user[0].email,
      role: user[0].role,
    });
  } catch (error) {
    console.error(" Verify token error:", error);
    res.status(500).json({ error: "Token verification failed" });
  }
};
