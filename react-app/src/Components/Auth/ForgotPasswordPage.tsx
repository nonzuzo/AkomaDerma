// forgot password page with form validation, loading state, and success message after submission. Copied styles from LoginPage for consistency.

import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Styles (copied 1:1 from LoginPage) ──────────────────────────────────────
  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      backgroundColor: "#f0f4f8",
    },
    leftPanel: {
      flex: "0 0 40%",
      background: "linear-gradient(135deg, #3db5e6 0%, #2a8fb5 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "3rem",
      color: "white",
      position: "relative",
      overflow: "hidden",
    },
    rightPanel: {
      flex: "1",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      backgroundColor: "#ffffff",
    },
    formContainer: { width: "100%", maxWidth: "450px", padding: "2rem" },
    logo: {
      fontSize: "2.5rem",
      fontWeight: "bold",
      marginBottom: "1rem",
      textAlign: "center",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "0.5rem",
      color: "#1a202c",
    },
    subtitle: { color: "#718096", marginBottom: "2.5rem", fontSize: "0.95rem" },
    inputGroup: { marginBottom: "1.5rem" },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#2d3748",
      fontWeight: "500",
    },
    input: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "1rem",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    inputDisabled: { backgroundColor: "#f7fafc", cursor: "not-allowed" },
    error: { color: "#e53e3e", fontSize: "0.875rem", marginTop: "0.25rem" },
    button: {
      width: "100%",
      padding: "1rem",
      backgroundColor: "#3db5e6",
      color: "white",
      border: "none",
      borderRadius: "50px",
      fontSize: "1.1rem",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "1.5rem",
      transition: "background-color 0.2s",
    },
    buttonDisabled: { backgroundColor: "#a0aec0", cursor: "not-allowed" },
    footer: {
      textAlign: "center",
      marginTop: "2rem",
      color: "#718096",
      fontStyle: "italic",
    },
    leftContent: { textAlign: "center", zIndex: 1 },
    leftTitle: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "1rem",
      lineHeight: "1.3",
    },
    leftSubtitle: { fontSize: "1.1rem", opacity: 0.9, lineHeight: "1.6" },
    decorativeCircle: {
      position: "absolute",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
    },
  };

  return (
    <div style={styles.container}>
      {/* ── Left decorative panel ─────────────────────────────────────── */}
      <div style={styles.leftPanel}>
        <div
          style={{
            ...styles.decorativeCircle,
            width: "300px",
            height: "300px",
            top: "-100px",
            left: "-100px",
          }}
        />
        <div
          style={{
            ...styles.decorativeCircle,
            width: "200px",
            height: "200px",
            bottom: "-50px",
            right: "-50px",
          }}
        />
        <div style={styles.leftContent}>
          <div style={styles.logo}>
            <span style={{ color: "#fff" }}>Akoma</span>
            <span style={{ color: "#1a202c" }}>Derma</span>
          </div>
          <h2 style={styles.leftTitle}>Forgot Your Password?</h2>
          <p style={styles.leftSubtitle}>
            No worries — it happens.
            <br />
            Enter your registered email and
            <br />
            we'll send you a reset link instantly.
          </p>
        </div>
      </div>

      {/* ── Right panel — Form or Success message ────────────────────── */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          {submitted ? (
            // ── Success State ──────────────────────────────────────────
            <div style={{ textAlign: "center" }}>
              {/* Checkmark icon */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "#ebf8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3db5e6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 style={{ ...styles.title, textAlign: "center" }}>
                Check Your Email
              </h1>
              <p
                style={{
                  ...styles.subtitle,
                  textAlign: "center",
                  marginBottom: "0.5rem",
                }}
              >
                If <strong style={{ color: "#2d3748" }}>{email}</strong> is
                registered, a password reset link has been sent.
              </p>
              <p
                style={{
                  color: "#a0aec0",
                  fontSize: "0.85rem",
                  marginBottom: "2rem",
                }}
              >
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                style={{ ...styles.button, marginTop: "0" }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#2a8fb5")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#3db5e6")}
              >
                Try a Different Email
              </button>
              <div style={styles.footer}>
                Remembered it?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#3db5e6",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            // ── Form State ─────────────────────────────────────────────
            <div>
              <h1 style={styles.title}>Reset Password</h1>
              <p style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your
                password
              </p>

              {/* Email input */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  style={{
                    ...styles.input,
                    ...(isLoading && styles.inputDisabled),
                  }}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
                {error && <div style={styles.error}>{error}</div>}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  ...styles.button,
                  ...(isLoading && styles.buttonDisabled),
                }}
                onMouseOver={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = "#2a8fb5";
                }}
                onMouseOut={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = "#3db5e6";
                }}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>

              {/* Footer */}
              <div style={styles.footer}>
                Remembered it?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#3db5e6",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                  }}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
