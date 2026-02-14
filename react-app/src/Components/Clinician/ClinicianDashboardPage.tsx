// src/pages/clinician/Dashboard.tsx - MODIFIED FOR PID/NAME SEARCH ONLY
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Plus,
  Calendar,
  Users,
  FileText,
  User,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    walkInQueue: 0,
    casesCreatedToday: 0,
    sentToDerm: 0,
    treatmentReady: 0,
    completedCases: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/clinicians/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setStats(data.stats || stats);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Dashboard error:", error);
      setError("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  // SIMPLE PID/NAME SEARCH - NO AI
  const handlePatientSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/clinicians/patients/search?q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const results = await response.json();
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    // Navigate to case creation with patient pre-filled
    navigate(
      `/clinician/create-case?patientId=${
        patient.patient_id
      }&name=${encodeURIComponent(
        `${patient.first_name} ${patient.last_name}`
      )}`
    );
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleNewPatient = () => navigate("/clinician/create-case");
  const handleNewAppointment = () => navigate("/clinician/appointments");
  const handleNewCase = () => navigate("/clinician/create-case");

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "50vh",
          fontSize: "1.25rem",
          color: "#64748b",
        }}
      >
        Loading live data...
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            borderLeft: "4px solid #ef4444",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {error}
          <button
            onClick={fetchDashboardData}
            style={{
              background: "#3db5e6",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Today's Overview
        </h1>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={cardStyle("#3db5e6", "#e0f2fe")}>
          <Calendar size={48} style={{ color: "#3db5e6" }} />
          <h3 style={cardTitleStyle}>Appointments Today</h3>
          <p style={cardNumberStyle}>{stats.appointmentsToday}</p>
        </div>
        <div style={cardStyle("#10b981", "#d1fae5")}>
          <Users size={48} style={{ color: "#10b981" }} />
          <h3 style={cardTitleStyle}>Walk-in Queue</h3>
          <p style={cardNumberStyle}>{stats.walkInQueue}</p>
        </div>
        <div style={cardStyle("#f59e0b", "#fef3c7")}>
          <FileText size={48} style={{ color: "#f59e0b" }} />
          <h3 style={cardTitleStyle}>Cases Created Today</h3>
          <p style={cardNumberStyle}>{stats.casesCreatedToday}</p>
        </div>
        <div style={cardStyle("#ef4444", "#fee2e2")}>
          <FileText size={48} style={{ color: "#ef4444" }} />
          <h3 style={cardTitleStyle}>Sent to Derm</h3>
          <p style={cardNumberStyle}>{stats.sentToDerm}</p>
        </div>
        <div style={cardStyle("#8b5cf6", "#ede9fe")}>
          <FileText size={48} style={{ color: "#8b5cf6" }} />
          <h3 style={cardTitleStyle}>Treatment Ready</h3>
          <p style={cardNumberStyle}>{stats.treatmentReady}</p>
        </div>
        <div style={cardStyle("#06b6d4", "#cffafe")}>
          <FileText size={48} style={{ color: "#06b6d4" }} />
          <h3 style={cardTitleStyle}>Total Cases</h3>
          <p style={cardNumberStyle}>{stats.completedCases}</p>
        </div>
      </div>

      {/* SEARCH + NOTIFICATIONS + QUICK ACTIONS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* PATIENT SEARCH  */}
        <div style={sectionCardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
              gap: "0.75rem",
            }}
          >
            <Search size={24} style={{ color: "#3db5e6" }} />
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#1e293b",
                margin: 0,
              }}
            >
              Find Patient
            </h3>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search by PID or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handlePatientSearch(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                transition: "all 0.2s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3db5e6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            {searchLoading && (
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#3db5e6",
                }}
              >
                🔍
              </div>
            )}
          </div>

          {/* SEARCH RESULTS */}
          {showResults && searchResults.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
              }}
            >
              {searchResults.map((patient) => (
                <div
                  key={patient.patient_id}
                  onClick={() => handleSelectPatient(patient)}
                  style={{
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e0f2fe")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  <User size={18} style={{ color: "#3db5e6", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: "600", color: "#1e293b" }}>
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      PID: {patient.patient_id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div style={sectionCardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
              gap: "0.75rem",
            }}
          >
            <Bell size={24} style={{ color: "#f59e0b" }} />
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#1e293b",
                margin: 0,
              }}
            >
              Notifications
            </h3>
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.slice(0, 3).map((notif, idx) => (
              <div
                key={idx}
                style={{
                  padding: "1rem",
                  backgroundColor: "#fef3c7",
                  borderLeft: "4px solid #f59e0b",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                  fontSize: "0.95rem",
                }}
              >
                {typeof notif === "object"
                  ? notif.message || "Notification"
                  : notif}
              </div>
            ))}
            {notifications.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontStyle: "italic",
                }}
              >
                No new notifications
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={sectionCardStyle}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#1e293b",
              marginBottom: "1.5rem",
            }}
          >
            Quick Actions
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <button
              style={quickActionStyle("#3db5e6")}
              onClick={handleNewPatient}
            >
              <Plus size={20} /> New Patient
            </button>
            <button
              style={quickActionStyle("#10b981")}
              onClick={handleNewAppointment}
            >
              <Calendar size={20} /> New Appointment
            </button>
            <button style={quickActionStyle("#8b5cf6")} onClick={handleNewCase}>
              <Plus size={20} /> New Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLES (unchanged + new hover effect)
const cardStyle = (accentColor, bgColor) => ({
  padding: "2rem",
  borderRadius: "20px",
  backgroundColor: "#ffffff",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  border: `1px solid ${bgColor}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  transition: "all 0.3s",
  cursor: "pointer",
});

const cardTitleStyle = {
  fontSize: "1rem",
  fontWeight: "500",
  color: "#64748b",
  margin: "1rem 0 0.5rem 0",
};

const cardNumberStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold",
  color: "#1e293b",
  margin: 0,
};

const sectionCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  padding: "2rem",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
};

const quickActionStyle = (color) => ({
  padding: "1rem 1.25rem",
  backgroundColor: color,
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontSize: "0.95rem",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  transition: "all 0.2s",
});
