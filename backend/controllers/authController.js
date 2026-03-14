/**
 * Complete auth flow- Signup → Admin Approval → Resend Passcode → Verify → Login
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import pool from "../config/db.js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import { logEvent } from "../utils/analytics.js"; // path from that file

// Lazy initialization — only throws if email is actually sent, not on startup
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in environment variables");
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const generatePasscode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 1. USER SIGNUP
 * POST /api/auth/signup
 */

export const signup = async (req, res) => {
  try {
    let { full_name, email, role, password } = req.body;
    console.log(" Signup payload:", req.body);

    // Normalize inputs
    full_name = (full_name || "").trim();
    email = (email || "").toLowerCase().trim();
    role = (role || "").toLowerCase().trim();

    // debug
    console.log("Checking email in DB:", email);

    // Required fields
    if (!full_name || !email || !role || !password) {
      return res.status(400).json({
        error: "Missing required fields: full_name, email, role, password",
      });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Role whitelist
    const allowedRoles = ["clinician", "dermatologist"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Password policy: 8+ chars, upper, lower, number
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        error: "Password must include uppercase, lowercase, and a number",
      });
    }

    // Check if email exists
    const [existing] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await pool.execute(
      "INSERT INTO users (full_name, email, role, password_hash, is_approved, created_at) VALUES (?, ?, ?, ?, 0, NOW())",
      [full_name, email, role, hashedPassword]
    );

    const newUserId = result.insertId;

    //// analytics log - signup event
    // fire-and-forget analytics
    logEvent({
      userId: newUserId,
      eventType: "SIGNUP",
      detail: { role },
    });

    // Role-specific row
    if (role === "dermatologist") {
      await pool.execute(
        "INSERT INTO dermatologists (user_id, specialization, years_experience, created_at) VALUES (?, ?, ?, NOW())",
        [newUserId, "Dermatologist", 0]
      );
    } else if (role === "clinician") {
      await pool.execute(
        "INSERT INTO clinicians (user_id, clinic_name, created_at) VALUES (?, ?, NOW())",
        [newUserId, "Rabito Clinic"]
      );
    }

    console.log(` User created (ID: ${newUserId}) - Awaiting approval`);
    res.status(201).json({
      success: true,
      message: "User created! Awaiting admin approval.",
      user_id: newUserId,
    });
  } catch (error) {
    console.error(" Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 2. USER LOGIN
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log(" Login attempt:", email);

    email = (email || "").toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

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

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      console.log(" Invalid password");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // existing clinician / dermatologist auto-create blocks here...

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error(" Missing JWT_SECRET");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "7d",
      }
    );

    // analytics log - login success (after successful auth)
    logEvent({
      userId: user.user_id,
      eventType: "LOGIN_SUCCESS",
      detail: { role: user.role },
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
    res.status(500).json({ error: "Internal server error" });
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
 * 4. ADMIN: Approve user + send passcode via Resend
 * POST /api/auth/approve/:userId
 */
export const approveUser = async (req, res) => {
  try {
    console.log(" START approveUser userId:", req.params.userId);
    const userId = req.params.userId;
    const passcode = generatePasscode();

    console.log(" Generated passcode:", passcode);

    const [userCheck] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await pool.execute(
      "UPDATE users SET is_approved = 1, passcode = ?, passcode_expires_at = ? WHERE user_id = ?",
      [passcode, new Date(Date.now() + 24 * 60 * 60 * 1000), userId]
    );

    const [user] = await pool.execute(
      "SELECT email, full_name FROM users WHERE user_id = ?",
      [userId]
    );

    if (!user[0]?.email) {
      return res.status(500).json({ error: "User email not found" });
    }

    console.log(" Sending to:", user[0].email);

    // ✅ getResend() called here — not at startup
    const { error: emailError } = await getResend().emails.send({
      from: "AkomaDerma <onboarding@resend.dev>",
      to: user[0].email,
      subject: "Telederma Account Approved - Your Passcode",
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
    // Did this becasue of railway + resend not working together, but should be fine to leave in as a safety check and sending to only one email
    // if (emailError) {
    //   console.error(" Resend error:", emailError);
    //   return res.status(500).json({ error: emailError.message });
    // }

    if (emailError) {
      console.error(" Resend error:", emailError);
      // Don't block approval just because email failed
      return res.json({
        success: true,
        message:
          "User approved, but the verification email could not be sent. " +
          "Please share the passcode manually: " +
          passcode,
      });
    }

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
 * 5. USER: Verify passcode
 * POST /api/auth/verify-passcode
 */
export const verifyPasscode = async (req, res) => {
  try {
    // Normalize email and passcode from request body
    let { email, passcode } = req.body;
    email = (email || "").toLowerCase().trim();
    passcode = (passcode || "").trim();
    console.log(" Verifying passcode for:", email);

    // Require both fields
    if (!email || !passcode) {
      return res.status(400).json({ error: "Email and passcode are required" });
    }

    // Look up user with matching passcode that is still valid
    const [users] = await pool.execute(
      `SELECT * FROM users 
       WHERE email = ? AND passcode = ? AND is_approved = 1 
       AND passcode_expires_at > NOW()`,
      [email, passcode]
    );

    // Handle invalid or expired code
    if (users.length === 0) {
      console.log(" Invalid/expired passcode");
      return res.status(400).json({ error: "Invalid or expired passcode!" });
    }

    // Clear passcode after successful verification
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
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 6. STATUS CHECK
 * POST /api/auth/status
 */
// 6. STATUS CHECK
export const getAuthStatus = async (req, res) => {
  try {
    // Normalize email from request body
    let { email } = req.body;
    email = (email || "").toLowerCase().trim();
    console.log(" Status check for:", email);

    // Require email
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Fetch approval + passcode status
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

    // Ready to log in
    res.json({
      status: "ready_to_login",
      message: "Account fully verified and ready",
    });
  } catch (error) {
    console.error(" Status check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 7. TOKEN VERIFY
 * GET /api/auth/verify
 */
export const verifyToken = async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log(" Verifying token for user:", userId);

    const [user] = await pool.execute(
      "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

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

/**
 * 8. FORGOT PASSWORD
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const [users] = await pool.execute(
      "SELECT user_id, full_name FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (users.length === 0)
      return res.json({
        message: "If that email is registered, a reset link has been sent.",
      });

    const user = users[0];

    await pool.execute(
      "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
      [user.user_id]
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.user_id, rawToken, expiresAt]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

    // getResend() called here — not at startup
    const { error: emailError } = await getResend().emails.send({
      from: "AkomaDerma <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your TeleDerma Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;
                    padding: 2rem; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1e293b;">Password Reset Request</h2>
          <p style="color: #64748b;">Hi ${user.full_name},</p>
          <p style="color: #64748b;">Click the button below to reset your TeleDerma password.</p>
          <a href="${resetLink}"
             style="display:inline-block; margin: 1.5rem 0; padding: 0.85rem 2rem;
                    background: linear-gradient(135deg, #3db5e6, #1e40af);
                    color: #fff; border-radius: 10px; text-decoration: none;
                    font-weight: 600;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 0.85rem;">
            This link expires in <b>1 hour</b>.
            If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error(" Resend error:", emailError);
      return res.status(500).json({ error: emailError.message });
    }

    return res.json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 9. RESET PASSWORD
 * POST /api/auth/reset-password
 */
// 9. RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    // Extract token and new password from request body
    const { token, password } = req.body;

    // Require both fields
    if (!token || !password) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    // Enforce same password policy as signup: 8+ chars, upper, lower, number
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        error: "Password must include uppercase, lowercase, and a number",
      });
    }

    // Look up valid, unused token
    const [tokens] = await pool.execute(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    // Handle invalid or expired token
    if (tokens.length === 0) {
      return res.status(400).json({
        error:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Extract token row and hash new password
    const { id: tokenId, user_id } = tokens[0];
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await pool.execute("UPDATE users SET password_hash = ? WHERE user_id = ?", [
      hashedPassword,
      user_id,
    ]);

    // Mark token as used
    await pool.execute(
      "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
      [tokenId]
    );

    // Respond success
    return res.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
