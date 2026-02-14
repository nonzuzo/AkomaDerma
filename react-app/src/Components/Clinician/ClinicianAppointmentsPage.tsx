// src/Components/Clinician/ClinicianAppointmentsPage.tsx - PRODUCTION READY
import React, { useState, useEffect } from "react";
import { Search, Calendar, Clock, User, CheckCircle, Plus } from "lucide-react";

export default function ClinicianAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // AI Profile Modal State
  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });

  //appointment modal state
  const [newApptModal, setNewApptModal] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    patient_id: "",
    appointment_date: "",
    notes: "",
  });

  // Backend-ready data fetch
  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/clinician/appointments?filter=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Appointments fetch error:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // CREATE NEW APPOINTMENT FUNCTION
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/clinician/appointments",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newApptForm),
        }
      );

      if (response.ok) {
        setNewApptModal(false);
        setNewApptForm({ patient_id: "", appointment_date: "", notes: "" });
        fetchAppointments(); // Refresh appointments list
        alert("Appointment created successfully");
      } else {
        const errorData = await response.json();
        alert("Create failed: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Create appointment error:", error);
      alert("Network error: " + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <div style={{ fontSize: "1.2rem", color: "#64748b" }}>
          Loading appointments...
        </div>
      </div>
    );
  }

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.patient_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      appointment.pid
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem 0" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={headerStyle}>Appointment Management</h1>
        <p style={subtitleStyle}>
          Today's booked patients with AI patient profiling
        </p>
      </div>
      {/* FILTERS + SEARCH + NEW APPOINTMENT */}
      <div style={controlPanelStyle}>
        {/* Date Filters */}
        <div style={filterSectionStyle}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#1e293b",
            }}
          >
            Filter by Date
          </h3>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {["today", "week", "all"].map((period) => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                style={{
                  ...filterButtonStyle,
                  ...(filter === period ? activeFilterStyle : {}),
                }}
              >
                {period === "today"
                  ? "Today"
                  : period === "week"
                  ? "This Week"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={searchSectionStyle}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={20}
              style={{ position: "absolute", left: "1rem", color: "#3db5e6" }}
            />
            <input
              type="text"
              placeholder="Search by patient name or PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
        </div>

        {/* New Appointment CTA */}
        <div style={ctaSectionStyle}>
          <button
            style={newAppointmentButtonStyle}
            onClick={() => setNewApptModal(true)}
            //onClick={() => alert("Create appointment modal coming soon!")}
          >
            <Plus size={20} style={{ marginRight: "0.5rem" }} />
            Book New Appointment
          </button>
        </div>
      </div>
      {/* APPOINTMENTS LIST */}
      <div style={appointmentsContainerStyle}>
        {filteredAppointments.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.appointment_id}
              appointment={appointment}
              profileModal={profileModal}
              setProfileModal={setProfileModal}
            />
          ))
        )}
      </div>
      {/* BEAUTIFUL AI PROFILE MODAL */}
      {profileModal.open && profileModal.data && (
        <dialog
          open
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            borderRadius: "20px",
            padding: "2rem",
            maxWidth: "650px",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
            border: "none",
            fontFamily: "system-ui, -apple-system, sans-serif",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#1e293b",
                fontSize: "1.8rem",
                fontWeight: 700,
              }}
            >
              👤 {profileModal.data.full_name} Profile
            </h2>
            <button
              onClick={() => setProfileModal({ open: false, data: null })}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "0.75rem 1.25rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.95rem",
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* DEMOGRAPHICS */}
          <div
            style={{
              background: "#f8fafc",
              padding: "1.25rem",
              borderRadius: "12px",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                color: "#3b82f6",
                margin: "0 0 0.75rem 0",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              📋 Demographics
            </h3>
            <p style={{ margin: 0, fontSize: "1rem" }}>
              <strong>Age:</strong>{" "}
              <span style={{ color: "#1e293b" }}>
                {profileModal.data.demographics.age}
              </span>{" "}
              |<strong>Gender:</strong>{" "}
              <span style={{ color: "#1e293b" }}>
                {profileModal.data.demographics.gender}
              </span>{" "}
              |<strong>Contact:</strong>{" "}
              <span style={{ color: "#3db5e6" }}>
                {profileModal.data.demographics.contact}
              </span>
            </p>
          </div>

          {/* CURRENT CASE */}
          <div
            style={{
              background: "#fef3c7",
              padding: "1.25rem",
              borderRadius: "12px",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                color: "#f59e0b",
                margin: "0 0 0.75rem 0",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              📋 Current Case
            </h3>
            <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
              <strong>Complaint:</strong>{" "}
              {profileModal.data.current_case.chief_complaint}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
              <strong>Location:</strong>{" "}
              {profileModal.data.current_case.lesion_location}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
              <strong>Duration:</strong>{" "}
              {profileModal.data.current_case.lesion_duration}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
              <strong>Symptoms:</strong>{" "}
              {profileModal.data.current_case.symptoms}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
              <strong>Status:</strong> {profileModal.data.current_case.status}
            </p>
          </div>

          {/* MEDICAL HISTORY */}
          <div
            style={{
              background: "#ecfdf5",
              padding: "1.25rem",
              borderRadius: "12px",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                color: "#10b981",
                margin: "0 0 0.75rem 0",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              📚 Medical History
            </h3>
            <div style={{ fontSize: "0.95rem" }}>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Conditions:</strong>{" "}
                {profileModal.data.medical_history?.conditions ||
                  "None recorded"}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Severity:</strong>{" "}
                {profileModal.data.medical_history?.severities || "N/A"}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Past Diagnoses:</strong>{" "}
                {profileModal.data.medical_history?.diagnoses ||
                  "None recorded"}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Past Medications:</strong>{" "}
                {profileModal.data.medical_history?.medications ||
                  "None recorded"}
              </p>
            </div>
          </div>

          {/* AI CLINICAL ASSESSMENT */}
          {profileModal.data.ai_clinical_assessment && (
            <div
              style={{
                background: "#f3e8ff",
                padding: "1.25rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  color: "#8b5cf6",
                  margin: "0 0 0.75rem 0",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                🤖 AI Clinical Assessment
              </h3>
              <div
                style={{
                  background: "#ffffff",
                  padding: "1rem",
                  borderRadius: "8px",
                  borderLeft: "4px solid #8b5cf6",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                {profileModal.data.ai_clinical_assessment}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <button
              style={{
                background: "#3db5e6",
                color: "white",
                border: "none",
                padding: "1rem 2rem",
                borderRadius: "12px",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(61,181,230,0.3)",
              }}
            >
              📤 Send to Dermatologist
            </button>
            <button
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                padding: "1rem 2rem",
                borderRadius: "12px",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              }}
            >
              💾 Save Profile
            </button>
          </div>

          {/* BACKDROP */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: -1,
            }}
            onClick={() => setProfileModal({ open: false, data: null })}
          />
        </dialog>
      )}
      {/* BACKDROP FOR DIALOG */}
      {profileModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 9998,
          }}
        />
      )}
      // NEW APPOINTMENT MODAL - ADD THIS COMPLETE BLOCK
      {newApptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
          onClick={() => setNewApptModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "2.5rem",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                New Appointment
              </h2>
              <button
                onClick={() => setNewApptModal(false)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                }}
              >
                
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAppointment}>
              {/* Patient ID Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Patient ID <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  value={newApptForm.patient_id}
                  onChange={(e) =>
                    setNewApptForm({
                      ...newApptForm,
                      patient_id: e.target.value,
                    })
                  }
                  placeholder="e.g. 3"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                  }}
                />
                <small
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    display: "block",
                    marginTop: "0.25rem",
                  }}
                >
                  Available: 3=John oe, 4=Jane Smth, 5=Mike Johnson, 6=Sarah
                  Wilson
                </small>
              </div>

              {/* Date/Time Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Date & Time <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newApptForm.appointment_date}
                  onChange={(e) =>
                    setNewApptForm({
                      ...newApptForm,
                      appointment_date: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              {/* Notes Field */}
              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Notes (optional)
                </label>
                <textarea
                  value={newApptForm.notes}
                  onChange={(e) =>
                    setNewApptForm({ ...newApptForm, notes: e.target.value })
                  }
                  placeholder="Clinical notes, reason for visit..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    resize: "vertical",
                    fontFamily: "system-ui, sans-serif",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setNewApptModal(false)}
                  style={{
                    padding: "1rem 2rem",
                    border: "2px solid #d1d5db",
                    background: "white",
                    color: "#374151",
                    borderRadius: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "1rem 2rem",
                    background: "#3db5e6",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// SINGLE AppointmentCard COMPONENT
function AppointmentCard({ appointment, profileModal, setProfileModal }) {
  const getStatusColor = (status) => {
    const colors = {
      booked: { bg: "#3db5e6", color: "#ffffff" },
      checked_in: { bg: "#10b981", color: "#ffffff" },
      completed: { bg: "#6b7280", color: "#ffffff" },
      cancelled: { bg: "#ef4444", color: "#ffffff" },
    };
    return colors[status] || colors.booked;
  };

  const formatTime = (timeStr) => {
    try {
      return new Date(timeStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const safeAppointment = {
    appointment_id: appointment.appointment_id || "N/A",
    patient_name: appointment.patient_name || "Unknown Patient",
    pid: appointment.pid || "N/A",
    appointment_time: appointment.appointment_time || new Date().toISOString(),
    status: appointment.status || "booked",
    ai_summary: appointment.ai_summary || "No AI summary available",
    phone: appointment.phone || "N/A",
    notes: appointment.notes || "",
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "2.5rem",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
        border: "1px solid #e0f2fe",
        transition: "all 0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 30px 60px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.08)";
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 200px 180px 220px",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* TIME */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#3db5e6",
              color: "#ffffff",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {formatTime(safeAppointment.appointment_time).split(":")[0]}
            <br />
            <span style={{ fontSize: "0.85rem" }}>HRS</span>
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#64748b",
              marginTop: "0.5rem",
            }}
          >
            {new Date(safeAppointment.appointment_time).toLocaleDateString()}
          </div>
        </div>

        {/* PATIENT INFO */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1e293b" }}
          >
            {safeAppointment.patient_name}
          </div>
          <div
            style={{ color: "#3db5e6", fontWeight: "600", fontSize: "0.95rem" }}
          >
            PID: {safeAppointment.pid}
          </div>
          <div style={{ color: "#64748b" }}>
            <User
              size={16}
              style={{
                display: "inline",
                marginRight: "0.25rem",
                position: "relative",
                top: "2px",
              }}
            />
            {safeAppointment.phone}
          </div>
        </div>

        {/* AI SUMMARY */}
        <div>
          <div
            style={{
              backgroundColor: "#fef3c7",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              borderLeft: "4px solid #f59e0b",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "#92400e",
                fontWeight: "600",
              }}
            >
              AI Summary
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#7c2d12",
                marginTop: "0.25rem",
              }}
            >
              {safeAppointment.ai_summary}
            </div>
          </div>
          {safeAppointment.notes && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                backgroundColor: "#f8fafc",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
              }}
            >
              {safeAppointment.notes}
            </div>
          )}
        </div>

        {/* STATUS */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "0.8rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              backgroundColor: getStatusColor(safeAppointment.status).bg,
              color: getStatusColor(safeAppointment.status).color,
            }}
          >
            {safeAppointment.status.replace("_", " ").toUpperCase()}
          </div>
        </div>

        {/* ACTIONS - FIXED AI PROFILE BUTTON */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            style={actionButtonStyle("#3db5e6")}
            onClick={() =>
              alert("Check-in patient: " + safeAppointment.patient_name)
            }
          >
            <CheckCircle size={16} /> Check-in
          </button>
          <button
            style={actionButtonStyle("#8b5cf6")}
            onClick={() =>
              alert("Create case for: " + safeAppointment.patient_name)
            }
          >
            ➕ Create Case
          </button>
          <button
            style={actionButtonStyle("#10b981")}
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                console.log(
                  "🔍 Calling AI Profile for PID:",
                  safeAppointment.pid
                );

                const response = await fetch(
                  `http://localhost:5001/api/clinician/patient/${safeAppointment.pid}/ai-profile`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const profile = await response.json();
                console.log("✅ AI Profile loaded:", profile);
                // 🎉 OPEN BEAUTIFUL MODAL
                setProfileModal({ open: true, data: profile });
              } catch (error) {
                console.error("AI Profile Error:", error);
                alert("AI Profile failed: " + (error as Error).message);
              }
            }}
          >
            👤 View AI Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ALL YOUR EXISTING STYLES (UNCHANGED)
const headerStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold",
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitleStyle = {
  color: "#64748b",
  fontSize: "1.1rem",
  marginTop: "0.5rem",
};

const controlPanelStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 300px 220px",
  gap: "1.5rem",
  marginBottom: "2rem",
  backgroundColor: "#ffffff",
  padding: "2rem",
  borderRadius: "24px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
};

const filterSectionStyle = {
  display: "flex",
  flexDirection: "column",
};

const filterButtonStyle = {
  padding: "0.75rem 1.25rem",
  border: "2px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  color: "#64748b",
  borderRadius: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
};

const activeFilterStyle = {
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  borderColor: "#3db5e6",
  boxShadow: "0 4px 12px rgba(61,181,230,0.3)",
};

const searchSectionStyle = {
  display: "flex",
  alignItems: "center",
};

const searchInputStyle = {
  width: "100%",
  padding: "1rem 1rem 1rem 3rem",
  border: "2px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "1rem",
  outline: "none",
  transition: "all 0.2s",
};

const ctaSectionStyle = {};

const newAppointmentButtonStyle = {
  width: "100%",
  padding: "1rem 1.5rem",
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};

const appointmentsContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const actionButtonStyle = (color) => ({
  padding: "0.75rem 1.25rem",
  backgroundColor: color,
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "0.9rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  transition: "all 0.2s",
  whiteSpace: "nowrap",
});

// EMPTY STATE (UNCHANGED)
function EmptyState() {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "4rem 2rem",
        textAlign: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      }}
    >
      <Calendar
        size={64}
        style={{ color: "#3db5e6", marginBottom: "1.5rem", opacity: 0.5 }}
      />
      <h3
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#1e293b",
        }}
      >
        No appointments scheduled
      </h3>
      <p style={{ color: "#64748b", fontSize: "1.1rem", marginBottom: "2rem" }}>
        Book your first appointment or check back later
      </p>
      <button style={newAppointmentButtonStyle}>
        <Plus size={20} style={{ marginRight: "0.5rem" }} />
        Book New Appointment
      </button>
    </div>
  );
}
