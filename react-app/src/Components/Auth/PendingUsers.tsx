// src/Components/Auth/PendingUsers.tsx - ADMIN DASHBOARD FOR USER APPROVAL
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PendingUsers() {
  const navigate = useNavigate();
  // STATE MANAGEMENT - Track pending users, loading state, and errors
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH PENDING USERS ON COMPONENT MOUNT - Runs once when page loads
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // FETCH PENDING USERS FROM BACKEND API
  // REPLACE your fetchPendingUsers function (lines 22-39):
  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // ADD AUTH TOKEN
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login as admin first");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/auth/pending-users",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // ✅ CRITICAL FIX
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPendingUsers(data);
      } else {
        setError(data.message || "Failed to fetch pending users");
      }
    } catch (err) {
      setError("Cannot connect to server. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  /////////////////////////////////////////////////////////////////////////
  //   export const approveUser = async (req, res) => {
  //     try {
  //       console.log("🎯 approveUser called for userId:", req.params.userId);  // for checks
  //       const userId = req.params.userId;

  // ADMIN APPROVES USER - Sends passcode email and updates status
  // REPLACE your approveUser function (around line 46):
  const approveUser = async (userId: number, email: string) => {
    if (!window.confirm(`Approve ${email} and send passcode email?`)) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/auth/approve/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message);

        // Auto-open verify passcode page for this user
        navigate("/verify-passcode", {
          state: {
            email: email, // Pre-fill email
            justApproved: true, // Show "Check your email!" message
          },
          replace: true,
        });

        fetchPendingUsers(); // Refresh list
      } else {
        alert(`Approval failed: ${data.message}`);
      }
    } catch (err) {
      alert("Cannot connect to server. Please check backend.");
    }
  };

  // INLINE STYLES - Matches your app design system exactly
  const styles = {
    // MAIN LAYOUT
    container: {
      minHeight: "100vh",
      backgroundColor: "#f0f4f8",
      padding: "2rem",
    } as React.CSSProperties,

    // HEADER SECTION
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
    } as React.CSSProperties,

    // PAGE TITLE WITH GRADIENT
    title: {
      fontSize: "2.5rem",
      fontWeight: "bold" as const,
      background: "linear-gradient(135deg, #3db5e6 0%, #2a8fb5 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
    } as React.CSSProperties,

    // REFRESH BUTTON
    refreshBtn: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#3db5e6",
      color: "white",
      border: "none",
      borderRadius: "50px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
    } as React.CSSProperties,

    // ERROR ALERT
    error: {
      backgroundColor: "#fed7d7",
      color: "#c53030",
      padding: "1rem",
      borderRadius: "8px",
      borderLeft: "4px solid #e53e3e",
      marginBottom: "1rem",
    } as React.CSSProperties,

    // TABLE CONTAINER
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      overflow: "hidden",
    } as React.CSSProperties,

    // TABLE STYLES
    table: {
      width: "100%",
      borderCollapse: "collapse",
    } as React.CSSProperties,

    th: {
      padding: "1rem",
      textAlign: "left" as const,
      fontWeight: "600",
      color: "#2d3748",
      backgroundColor: "#f7fafc",
      borderBottom: "2px solid #e2e8f0",
    } as React.CSSProperties,

    td: {
      padding: "1rem",
      borderBottom: "1px solid #e2e8f0",
    } as React.CSSProperties,

    // APPROVE BUTTON
    approveBtn: {
      padding: "0.5rem 1rem",
      backgroundColor: "#48bb78",
      color: "white",
      border: "none",
      borderRadius: "25px",
      fontSize: "0.9rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
    } as React.CSSProperties,

    // ROLE BADGE
    roleBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: "500",
    } as React.CSSProperties,

    // EMPTY STATE
    emptyState: {
      textAlign: "center" as const,
      padding: "4rem 2rem",
      color: "#718096",
    } as React.CSSProperties,

    // HOVER EFFECTS
    hoverEffect: {
      backgroundColor: "#f7fafc",
    } as React.CSSProperties,
  };

  // LOADING STATE
  if (loading) {
    return (
      <div style={styles.container}>
        <div
          style={{
            textAlign: "center" as const,
            padding: "4rem",
            color: "#718096",
          }}
        >
          <h2 style={{ fontSize: "1.5rem" }}>Loading pending users...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* PAGE HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button
          onClick={fetchPendingUsers}
          style={styles.refreshBtn}
          onMouseOver={(e) =>
            ((e.target as any).style.backgroundColor = "#2a8fb5")
          }
          onMouseOut={(e) =>
            ((e.target as any).style.backgroundColor = "#3db5e6")
          }
        >
          Refresh
        </button>
      </div>

      {/* ERROR DISPLAY */}
      {error && <div style={styles.error}>{error}</div>}

      {/* PENDING USERS TABLE */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Signed Up</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user: any) => (
              <tr
                key={user.user_id}
                onMouseEnter={(e) =>
                  ((e.currentTarget as any).style.backgroundColor = "#f7fafc")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as any).style.backgroundColor = "white")
                }
              >
                <td style={styles.td}>#{user.user_id}</td>
                <td style={styles.td}>{user.full_name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.roleBadge,
                      backgroundColor:
                        user.role === "clinician"
                          ? "#ebf8ff"
                          : user.role === "dermatologist"
                          ? "#f3e8ff"
                          : "#f7fafc",
                      color:
                        user.role === "clinician"
                          ? "#2c5282"
                          : user.role === "dermatologist"
                          ? "#553c9a"
                          : "#4a5568",
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => approveUser(user.user_id, user.email)}
                    style={styles.approveBtn}
                    onMouseOver={(e) =>
                      ((e.target as any).style.backgroundColor = "#38a169")
                    }
                    onMouseOut={(e) =>
                      ((e.target as any).style.backgroundColor = "#48bb78")
                    }
                  >
                    Approve & Send Passcode
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* EMPTY STATE - No pending users */}
        {pendingUsers.length === 0 && (
          <div style={styles.emptyState}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              No pending users
            </h3>
            <p style={{ fontSize: "1.1rem" }}>
              All accounts have been approved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
