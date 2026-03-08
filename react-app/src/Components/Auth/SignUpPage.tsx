import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// This component renders the Sign Up page for clinicians and dermatologists
export default function SignUpPage() {
  // State to hold form input values
  const [formData, setFormData] = useState({
    fullName: "", // User's full name
    email: "", // User's email address
    password: "", // Password input
    confirmPassword: "", // Password confirmation input
    userType: "clinician", // Role: clinician or dermatologist
    agreeToTerms: false, // Checkbox for agreeing to Terms of Service
  });

  // State to hold validation errors for each field
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Handle changes to all input fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Update state depending on input type (checkbox vs text/select)
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validate the form inputs before submission
  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    // Email validation
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    // Password validation
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    // Confirm password validation
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    // Terms checkbox validation
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms";

    // Update errors state
    setErrors(newErrors);

    // Return true if there are no errors
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Only proceed if form is valid
    if (validateForm()) {
      // Prepare payload for backend
      const submissionPayload = {
        full_name: formData.fullName, // matches DB column name
        email: formData.email, // matches DB column name
        password: formData.password, // plain password; backend will hash
        role: formData.userType, // clinician or dermatologist
      };
      console.log("Sending payload:", submissionPayload);

      try {
        // Send POST request to backend signup API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // send JSON
          },
          body: JSON.stringify(submissionPayload), // convert JS object to JSON string
        });
        console.log("Response status:", response.status);

        // Parse response from backend
        const data = await response.json();

        console.log("Response data:", data);

        if (response.ok) {
          alert("Account created! Awaiting admin approval.");
          navigate("/login");
        } else {
          // SHOW EMAIL ERROR IN FORM
          if (data.error?.includes("exists") || data.error?.includes("Email")) {
            setErrors({
              email: data.error || "Email already exists. Try logging in.",
            });
          } else {
            alert(`Signup failed: ${data.error || data.message}`);
          }
        }
      } catch (error) {
        alert("Cannot connect to server.");
      }
    }
  };

  // Inline styles for layout and form elements
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
      /* fontStyle: "italic",*/
    },
    subtitle: { color: "#718096", marginBottom: "2rem", fontSize: "0.95rem" },
    inputGroup: { marginBottom: "1.5rem" },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#2d3748",
      fontWeight: "500",
      /* fontStyle: "italic",*/
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
    select: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "1rem",
      backgroundColor: "white",
      cursor: "pointer",
      boxSizing: "border-box",
    },
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
      marginTop: "1rem",
      transition: "background-color 0.2s",
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      marginBottom: "1.5rem",
    },
    checkbox: {
      marginRight: "0.5rem",
      width: "18px",
      height: "18px",
      cursor: "pointer",
    },
    checkboxLabel: { fontSize: "0.9rem", color: "#4a5568" },
    link: { color: "#3db5e6", textDecoration: "none", fontWeight: "500" },
    footer: {
      textAlign: "center",
      marginTop: "1.5rem",
      color: "#718096",
      /*fontStyle: "italic",*/
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
      background: "rgba(255, 255, 255, 0.1)",
    },
  };

  return (
    <div style={styles.container}>
      {/* Left Panel - Branding and Info */}
      <div style={styles.leftPanel}>
        <div
          style={{
            ...styles.decorativeCircle,
            width: "300px",
            height: "300px",
            top: "-100px",
            left: "-100px",
          }}
        ></div>
        <div
          style={{
            ...styles.decorativeCircle,
            width: "200px",
            height: "200px",
            bottom: "-50px",
            right: "-50px",
          }}
        ></div>

        <div style={styles.leftContent}>
          <div style={styles.logo}>
            <span style={{ color: "#fff" }}>Akoma</span>
            <span style={{ color: "#1a202c" }}>Derma</span>
          </div>
          <h2 style={styles.leftTitle}>
            Join Ghana's Leading
            <br />
            Teledermatology Platform
          </h2>
          <p style={styles.leftSubtitle}>
            Connect your clinic with certified dermatologists,
            <br />
            submit cases securely,
            <br />
            and get expert guidance anytime, anywhere.
          </p>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>
            Please fill in your information to get started
          </p>

          <div>
            {/* User Type Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>I am a:</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="dermatologist">Dermatologist</option>
                <option value="clinician">Clinician</option>
              </select>
            </div>

            {/* Full Name */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <div style={styles.error}>{errors.fullName}</div>
              )}
            </div>

            {/* Email */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email:</label>
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

            {/* Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Minimum 8 characters"
              />
              {errors.password && (
                <div style={styles.error}>{errors.password}</div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={styles.input}
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <div style={styles.error}>{errors.confirmPassword}</div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                style={styles.checkbox}
                id="terms"
              />
              <label htmlFor="terms" style={styles.checkboxLabel}>
                I agree to the{" "}
                <a href="#terms" style={styles.link}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" style={styles.link}>
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <div style={styles.error}>{errors.agreeToTerms}</div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              style={styles.button}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#2a8fb5")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#3db5e6")}
            >
              Create Account
            </button>

            {/* Footer */}
            <div style={styles.footer}>
              Already have an account?{" "}
              <a href="/login" style={styles.link}>
                Log In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
