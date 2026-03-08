// src/Components/Auth/VerifyPasscode.tsx - USER PASSCODE VERIFICATION PAGE
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyPasscode() {
  // STATE MANAGEMENT - Form data, validation errors, loading, and messages
  const [formData, setFormData] = useState({
    email: "",
    passcode: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // HANDLE INPUT CHANGES - Updates form state and clears validation errors
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // For passcode: only allow digits, max 6 characters
    const processedValue =
      name === "passcode" ? value.replace(/\D/g, "").slice(0, 6) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear specific field error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof errors];
        return newErrors;
      });
    }
  };

  // FORM VALIDATION - Client-side validation before API call
  const validateForm = () => {
    const newErrors: any = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Passcode validation (exactly 6 digits)
    if (!formData.passcode || formData.passcode.length !== 6) {
      newErrors.passcode = "Enter 6-digit passcode from your email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FORM SUBMISSION - Verify passcode with backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      // POST to backend verification endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-passcode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Success - Show confirmation and redirect to login
        setMessage(`Account verified successfully! Redirecting to login...`);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        // Backend validation error (wrong passcode, expired, etc.)
        setMessage(`Verification failed: ${data.error || "Invalid passcode"}`);
        setErrors({ passcode: data.error });
      }
    } catch (error) {
      // Network/server error
      console.error("Verification error:", error);
      setMessage("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // INLINE STYLES - Matches your app design system exactly
  const styles = {
    // MAIN LAYOUT - Two-panel design matching your login page
    container: {
      minHeight: "100vh",
      display: "flex",
      backgroundColor: "#f0f4f8",
    } as React.CSSProperties,

    // LEFT PANEL - Branding and description
    leftPanel: {
      flex: "0 0 40%",
      background: "linear-gradient(135deg, #3db5e6 0%, #2a8fb5 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "3rem",
      color: "white",
      position: "relative" as const,
      overflow: "hidden",
    } as React.CSSProperties,

    // RIGHT PANEL - Form container
    rightPanel: {
      flex: "1",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      backgroundColor: "#ffffff",
    } as React.CSSProperties,

    // FORM CONTAINER
    formContainer: {
      width: "100%",
      maxWidth: "450px",
      padding: "2rem",
    } as React.CSSProperties,

    // PAGE TITLES
    title: {
      fontSize: "2rem",
      fontWeight: "bold" as const,
      marginBottom: "0.5rem",
      color: "#1a202c",
    } as React.CSSProperties,

    subtitle: {
      color: "#718096",
      marginBottom: "2.5rem",
      fontSize: "0.95rem",
    } as React.CSSProperties,

    // INPUT GROUPS
    inputGroup: {
      marginBottom: "1.5rem",
    } as React.CSSProperties,

    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#2d3748",
      fontWeight: "500",
    } as React.CSSProperties,

    input: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "1rem",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxSizing: "border-box",
    } as React.CSSProperties,

    // PASSCODE INPUT - Special styling
    passcodeInput: {
      fontSize: "1.5rem",
      fontFamily: "monospace",
      fontWeight: "bold" as const,
      letterSpacing: "0.2em",
      textAlign: "center" as const,
    } as React.CSSProperties,

    // VALIDATION ERRORS
    error: {
      color: "#e53e3e",
      fontSize: "0.875rem",
      marginTop: "0.25rem",
    } as React.CSSProperties,

    // SUCCESS/ERROR MESSAGES
    message: {
      padding: "1rem",
      borderRadius: "8px",
      textAlign: "center" as const,
      marginBottom: "1.5rem",
      fontWeight: "500",
    } as React.CSSProperties,

    // SUBMIT BUTTON
    button: {
      width: "100%",
      padding: "1.25rem",
      backgroundColor: "#3db5e6",
      color: "white",
      border: "none",
      borderRadius: "50px",
      fontSize: "1.1rem",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "1.5rem",
      transition: "background-color 0.2s",
    } as React.CSSProperties,

    // LINK STYLES
    link: {
      color: "#3db5e6",
      textDecoration: "none",
      fontWeight: "500",
      fontSize: "0.9rem",
    } as React.CSSProperties,

    // DECORATIVE ELEMENTS
    decorativeCircle: {
      position: "absolute" as const,
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.1)",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      {/* LEFT PANEL - Branding and Instructions */}
      <div style={styles.leftPanel}>
        {/* Decorative circles */}
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

        {/* Branding content */}
        <div style={{ textAlign: "center" as const, zIndex: 1 }}>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold" as const,
              marginBottom: "1rem",
            }}
          >
            <span style={{ color: "#fff" }}>Akoma</span>
            <span style={{ color: "#ffffff" }}>Derma</span>
          </div>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold" as const,
              marginBottom: "1rem",
            }}
          >
            Verify Account
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.9,
              lineHeight: "1.6",
            }}
          >
            Check your email for the 6-digit verification code
            <br />
            Enter it below to activate your Telederma account
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Verification Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Enter Passcode</h1>
          <p style={styles.subtitle}>
            We sent a 6-digit verification code to your email address
          </p>

          {/* SUCCESS/ERROR MESSAGES */}
          {message && (
            <div
              style={{
                ...styles.message,
                backgroundColor:
                  message.includes("verified") || message.includes("success")
                    ? "#c6f6d5"
                    : "#fed7d7",
                color:
                  message.includes("verified") || message.includes("success")
                    ? "#22543d"
                    : "#c53030",
                borderLeft: "4px solid",
                borderLeftColor:
                  message.includes("verified") || message.includes("success")
                    ? "#38a169"
                    : "#e53e3e",
              }}
            >
              {message}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
            {/* EMAIL INPUT */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="your.email@example.com"
              />
              {errors.email && <div style={styles.error}>{errors.email}</div>}
            </div>

            {/* PASSCODE INPUT */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>6-Digit Passcode:</label>
              <input
                type="text"
                name="passcode"
                value={formData.passcode}
                onChange={handleChange}
                maxLength={6}
                style={{
                  ...styles.input,
                  ...styles.passcodeInput,
                }}
                placeholder="123456"
              />
              {errors.passcode && (
                <div style={styles.error}>{errors.passcode}</div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseOver={(e) => {
                if (!loading)
                  (e.target as any).style.backgroundColor = "#2a8fb5";
              }}
              onMouseOut={(e) => {
                if (!loading)
                  (e.target as any).style.backgroundColor = "#3db5e6";
              }}
            >
              {loading ? "Verifying Passcode..." : "Verify Account"}
            </button>
          </form>

          {/* BACK TO LOGIN LINK */}
          <div
            style={{
              textAlign: "center" as const,
              marginTop: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#3db5e6",
                fontSize: "0.9rem",
                fontWeight: "500" as const,
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
