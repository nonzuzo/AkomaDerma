// src/pages/ResetPasswordPage.tsx
import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function ResetPasswordPage() {
  // Token is read from URL: /reset-password?token=xxxxxx
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength derived from length
  const strength =
    password.length === 0
      ? null
      : password.length < 8
      ? { label: "Weak", color: "#ef4444", width: "33%" }
      : password.length < 12
      ? { label: "Good", color: "#f59e0b", width: "66%" }
      : { label: "Strong", color: "#10b981", width: "100%" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // No token in URL — show error immediately
  if (!token) {
    return (
      <div style={s.pageWrap}>
        <div style={s.card}>
          <div style={s.errorBox}>
            Invalid or missing reset token. Please request a new reset link.
          </div>
          <Link to="/forgot-password" style={s.link}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.pageWrap}>
      <div style={s.card}>
        {/* Brand */}
        <div style={s.brandRow}>
          <div style={s.brandDot} />
          <span style={s.brandName}>TeleDerma</span>
        </div>

        <h2 style={s.title}>Set New Password</h2>

        {success ? (
          // ── Success state ─────────────────────────────────────────────
          <div style={s.successBox}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
            </div>
            <p
              style={{
                color: "#166534",
                fontWeight: 600,
                marginBottom: "0.4rem",
              }}
            >
              Password reset successfully!
            </p>
            <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <p style={s.subtitle}>
              Choose a strong new password for your account.
            </p>

            {error && <div style={s.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <label style={s.label}>New Password</label>
              <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    ...s.input,
                    marginBottom: 0,
                    paddingRight: "3.5rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={s.showBtn}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength bar */}
              {strength && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "2px",
                      backgroundColor: "#e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "2px",
                        transition: "all 0.3s",
                        width: strength.width,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: strength.color,
                      marginTop: "0.3rem",
                      fontWeight: 600,
                    }}
                  >
                    {strength.label}
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <label style={s.label}>Confirm Password</label>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={s.input}
              />

              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <Link to="/login" style={s.link}>
              ← Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  brandDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3db5e6, #1e40af)",
  },
  brandName: { fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  subtitle: { color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem" },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.4rem",
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "1.25rem",
  },
  showBtn: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  submitBtn: {
    width: "100%",
    padding: "0.9rem",
    background: "linear-gradient(135deg, #3db5e6, #1e40af)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
  },
  link: {
    display: "block",
    textAlign: "center",
    marginTop: "1.25rem",
    color: "#3db5e6",
    fontWeight: 600,
    fontSize: "0.9rem",
    textDecoration: "none",
  },
  successBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "1.5rem",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
};
