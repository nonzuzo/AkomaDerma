import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, CheckCircle, Loader } from "lucide-react";

export default function LogoutPage() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate logout process
    const logout = async () => {
      // Clear authentication data
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      sessionStorage.clear();

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsLoggingOut(false);
      setIsComplete(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    };

    logout();
  }, [navigate]);

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8fafc",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: "2rem",
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      padding: "3rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
      textAlign: "center" as const,
      maxWidth: "450px",
      width: "100%",
    },
    logo: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "2rem",
    },
    iconContainer: {
      width: "80px",
      height: "80px",
      margin: "0 auto 1.5rem",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s",
    },
    loggingOutIcon: {
      backgroundColor: "#fef3c7",
      border: "3px solid #f59e0b",
    },
    completeIcon: {
      backgroundColor: "#d1fae5",
      border: "3px solid #10b981",
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "0.75rem",
    },
    message: {
      fontSize: "1rem",
      color: "#64748b",
      marginBottom: "2rem",
      lineHeight: "1.6",
    },
    progressBar: {
      width: "100%",
      height: "4px",
      backgroundColor: "#e2e8f0",
      borderRadius: "2px",
      overflow: "hidden",
      marginBottom: "1.5rem",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3db5e6",
      animation: "progress 1.5s ease-in-out",
      width: "100%",
    },
    button: {
      padding: "0.75rem 2rem",
      backgroundColor: "#3db5e6",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      width: "100%",
    },
    link: {
      marginTop: "1rem",
      fontSize: "0.9rem",
      color: "#64748b",
    },
    linkText: {
      color: "#3db5e6",
      textDecoration: "none",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={{ color: "#3db5e6" }}>Akoma</span>
          <span style={{ color: "#000" }}>Derma</span>
        </div>

        {/* Icon */}
        <div
          style={{
            ...styles.iconContainer,
            ...(isLoggingOut ? styles.loggingOutIcon : styles.completeIcon),
          }}
        >
          {isLoggingOut ? (
            <Loader
              size={40}
              color="#f59e0b"
              style={{
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <CheckCircle size={40} color="#10b981" />
          )}
        </div>

        {/* Title & Message */}
        {isLoggingOut ? (
          <>
            <h1 style={styles.title}>Logging you out...</h1>
            <p style={styles.message}>
              Please wait while we securely sign you out of your account.
            </p>
            <div style={styles.progressBar}>
              <div style={styles.progressFill}></div>
            </div>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Successfully Logged Out</h1>
            <p style={styles.message}>
              You have been securely logged out. Thank you for using AkomaDerma.
            </p>
          </>
        )}

        {/* Action Button */}
        {isComplete && (
          <>
            <button
              style={styles.button}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#2a8fb5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#3db5e6")
              }
            >
              Return to Login
            </button>
            <div style={styles.link}>
              or{" "}
              <span style={styles.linkText} onClick={() => navigate("/")}>
                Go to Home
              </span>
            </div>
          </>
        )}
      </div>

      {/* Add CSS animation */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes progress {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
