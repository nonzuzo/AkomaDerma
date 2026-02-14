/**
 * AkomaDerma Login Page - Complete with Auto-Redirect Logic
 * Handles: Login + Status Check + Auto-redirect to verify-passcode
 * Production-ready with form validation, remember-me, role-based navigation
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  // State management for form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Real-time validation errors display
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); // Loading state for submit

  const navigate = useNavigate();

  /**
   * Load saved login credentials on component mount (remember me)
   */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const remember = localStorage.getItem("rememberMe");

    if (savedUser && remember === "true") {
      try {
        const user = JSON.parse(savedUser);
        setFormData({
          email: user.email || "",
          password: "",
          rememberMe: true,
        });
      } catch (e) {
        console.log("Cleared invalid saved login data");
        localStorage.removeItem("user");
      }
    }
  }, []);

  /**
   * Update form fields (handles both text inputs and checkboxes)
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Client-side form validation
   * Returns true if valid, false if errors found
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    // Update errors state and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Main form submission handler
   * 1. Try login
   * 2. If fails → Check status → Auto-redirect if needs passcode
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Step 1: Attempt login
      const loginResponse = await fetch(
        "http://localhost:5001/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        // LOGIN SUCCESS - Save token and user data
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData));

        // Handle remember me
        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          sessionStorage.setItem("user", JSON.stringify(loginData));
          localStorage.removeItem("rememberMe");
        }

        // Role-based navigation
        if (loginData.user?.role === "admin") {
          alert("Welcome, Admin!");
          navigate("/admin", { replace: true });
        } else if (loginData.user?.role === "clinician") {
          alert(`Welcome, ${loginData.user.full_name}!`);
          navigate("/clinician/dashboard", { replace: true });
        } else if (loginData.user?.role === "dermatologist") {
          alert(`Welcome, ${loginData.user.full_name}!`);
          navigate("/dermatologist/dashboard", { replace: true });
        }
      } else {
        // LOGIN FAILED - Check account status for auto-redirect
        console.log("Login failed - checking account status...");

        // Step 2: Call status endpoint to determine next step
        const statusResponse = await fetch(
          "http://localhost:5001/api/auth/status",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email.trim(),
            }),
          }
        );

        const statusData = await statusResponse.json();

        // AUTO-REDIRECT LOGIC
        if (statusData.status === "pending_approval") {
          alert(statusData.message);
        } else if (statusData.status === "needs_passcode") {
          alert(statusData.message);
          // Critical: Auto-redirect to verify passcode page
          navigate("/verify-passcode", {
            state: {
              email: formData.email.trim(),
            },
            replace: true,
          });
        } else {
          // Generic login error (wrong password, etc.)
          let errorMessage =
            loginData.error || loginData.message || "Login failed";

          // Custom error messages for better UX
          if (
            errorMessage.includes("credentials") ||
            errorMessage.includes("password")
          ) {
            errorMessage = "Invalid email or password";
          }

          alert(`Login Error: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error("Network error during login:", error);
      alert(
        "Cannot connect to server. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Inline styles (unchanged - your beautiful design)
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
    formContainer: {
      width: "100%",
      maxWidth: "450px",
      padding: "2rem",
    },
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
    subtitle: {
      color: "#718096",
      marginBottom: "2.5rem",
      fontSize: "0.95rem",
    },
    inputGroup: {
      marginBottom: "1.5rem",
    },
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
    inputDisabled: {
      backgroundColor: "#f7fafc",
      cursor: "not-allowed",
    },
    error: {
      color: "#e53e3e",
      fontSize: "0.875rem",
      marginTop: "0.25rem",
    },
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
    buttonDisabled: {
      backgroundColor: "#a0aec0",
      cursor: "not-allowed",
    },
    rememberForgot: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "1rem",
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
    },
    checkbox: {
      marginRight: "0.5rem",
      width: "18px",
      height: "18px",
      cursor: "pointer",
    },
    checkboxLabel: {
      fontSize: "0.9rem",
      color: "#4a5568",
    },
    link: {
      color: "#3db5e6",
      textDecoration: "none",
      fontWeight: "500",
      fontSize: "0.9rem",
    },
    footer: {
      textAlign: "center",
      marginTop: "2rem",
      color: "#718096",
      fontStyle: "italic",
    },
    leftContent: {
      textAlign: "center",
      zIndex: 1,
    },
    leftTitle: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "1rem",
      lineHeight: "1.3",
    },
    leftSubtitle: {
      fontSize: "1.1rem",
      opacity: 0.9,
      lineHeight: "1.6",
    },
    decorativeCircle: {
      position: "absolute",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.1)",
    },
  };

  return (
    <div style={styles.container}>
      {/* Left decorative panel */}
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
          <h2 style={styles.leftTitle}>Welcome Back!</h2>
          <p style={styles.leftSubtitle}>
            Access your secure clinic portal,
            <br />
            review patient case history,
            <br />
            and manage teledermatology consultations with ease.
          </p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Log In</h1>
          <p style={styles.subtitle}>
            Enter your credentials to access your account
          </p>

          <div>
            {/* Email input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(isLoading && styles.inputDisabled),
                }}
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
              {errors.email && <div style={styles.error}>{errors.email}</div>}
            </div>

            {/* Password input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(isLoading && styles.inputDisabled),
                }}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && (
                <div style={styles.error}>{errors.password}</div>
              )}
            </div>

            {/* Remember me and forgot password */}
            <div style={styles.rememberForgot}>
              <div style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={styles.checkbox}
                  id="remember"
                  disabled={isLoading}
                />
                <label htmlFor="remember" style={styles.checkboxLabel}>
                  Remember me
                </label>
              </div>
              <a href="#forgot" style={styles.link}>
                Forgot Password?
              </a>
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
                if (!isLoading) {
                  e.target.style.backgroundColor = "#2a8fb5";
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = "#3db5e6";
                }
              }}
            >
              {isLoading ? "Signing In..." : "Log In"}
            </button>

            {/* Footer - signup link */}
            <div style={styles.footer}>
              Don't have an account?{" "}
              <a href="/signup" style={styles.link}>
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
