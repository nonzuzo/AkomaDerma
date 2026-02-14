// src/Components/Clinician/ClinicianPatients.tsx
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  User,
  FileText,
  Calendar,
  TrendingUp,
  Plus,
} from "lucide-react";

export default function ClinicianPatients() {
  const [patients, setPatients] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend-ready fetch
    fetchPatients();
  }, [filterType]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/clinician/patients?filter=${filterType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      setPatients(mockPatients); // Fallback for design
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <div style={{ fontSize: "1.2rem", color: "#64748b" }}>
          Loading patients...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={headerStyle}>👥 All Patients (AI-Enhanced)</h1>
        <p style={subtitleStyle}>
          Smart search with AI condition insights and case history
        </p>
      </div>

      {/* CONTROLS */}
      <div style={controlPanelStyle}>
        {/* Filters */}
        <div style={filterSectionStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <Filter size={20} style={{ color: "#3db5e6" }} />
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#1e293b",
              }}
            >
              Filter Patients
            </h3>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Patients"},
              { id: "tinea", label: "Tinea"},
              { id: "acne", label: "Acne" },
              { id: "eczema", label: "Eczema" },
              { id: "recent", label: "Last 30 Days" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                style={{
                  ...filterButtonStyle,
                  ...(filterType === filter.id ? activeFilterStyle : {}),
                }}
              >
                {filter.icon} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={searchSectionStyle}>
          <div style={{ position: "relative" }}>
            <Search
              size={20}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#3db5e6",
              }}
            />
            <input
              type="text"
              placeholder="Name, PID, Phone, Condition (tinea, acne...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div style={statsSectionStyle}>
          <div style={statCardStyle("#3db5e6", "#e0f2fe")}>
            <User size={24} style={{ color: "#3db5e6" }} />
            <div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  color: "#1e293b",
                }}
              >
                247
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Total Patients
              </div>
            </div>
          </div>
          <div style={statCardStyle("#10b981", "#d1fae5")}>
            <TrendingUp size={24} style={{ color: "#10b981" }} />
            <div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  color: "#1e293b",
                }}
              >
                12
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Active Cases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PATIENTS GRID */}
      <div style={patientsGridStyle}>
        {filteredPatients.length === 0 ? (
          <EmptyPatientsState />
        ) : (
          filteredPatients.map((patient) => (
            <PatientCard key={patient.pid} patient={patient} />
          ))
        )}
      </div>
    </div>
  );
}

// MOCK DATA
const mockPatients = [
  {
    pid: "PID-000123",
    name: "John Doe",
    phone: "+233244567890",
    condition: "Tinea versicolor",
    caseCount: 3,
    lastVisit: "2026-01-28",
    aiSummary: "Chronic tinea (recurs every 3 months)",
    riskLevel: "high",
  },
  {
    pid: "PID-000456",
    name: "Grace Mensah",
    phone: "+233245678901",
    condition: "Acne",
    caseCount: 1,
    lastVisit: "2026-02-01",
    aiSummary: "Hormonal acne - scarring risk",
    riskLevel: "medium",
  },
];

// STYLES (Your #3db5e6 theme)
const headerStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold",
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
} as const;

const subtitleStyle = {
  color: "#64748b",
  fontSize: "1.1rem",
  marginTop: "0.5rem",
} as const;

const controlPanelStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 350px 280px",
  gap: "1.5rem",
  marginBottom: "2rem",
  backgroundColor: "#ffffff",
  padding: "2rem",
  borderRadius: "24px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
} as const;

const filterButtonStyle = {
  padding: "0.75rem 1.25rem",
  border: "2px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  color: "#64748b",
  borderRadius: "16px",
  fontWeight: "600",
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "all 0.2s",
  whiteSpace: "nowrap" as const,
} as const;

const activeFilterStyle = {
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  borderColor: "#3db5e6",
  boxShadow: "0 4px 12px rgba(61,181,230,0.3)",
} as const;

const searchInputStyle = {
  width: "100%",
  padding: "1rem 1rem 1rem 3rem",
  border: "2px solid #e2e8f0",
  borderRadius: "16px",
  fontSize: "1rem",
  outline: "none",
  transition: "all 0.2s",
} as const;

const patientsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))",
  gap: "1.5rem",
} as const;

// EMPTY STATE
function EmptyPatientsState() {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "4rem 2rem",
        textAlign: "center" as const,
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      }}
    >
      <User
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
        No patients found
      </h3>
      <p style={{ color: "#64748b", fontSize: "1.1rem", marginBottom: "2rem" }}>
        Register your first patient or adjust your search filters
      </p>
      <button
        style={{
          padding: "1rem 2rem",
          background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
          color: "white",
          border: "none",
          borderRadius: "16px",
          fontSize: "1rem",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        <Plus size={20} style={{ marginRight: "0.5rem", display: "inline" }} />
        Register New Patient
      </button>
    </div>
  );
}

// PATIENT CARD
function PatientCard({ patient }) {
  const getRiskBadge = (risk) => {
    const colors = {
      high: { bg: "#ef4444", color: "#ffffff" },
      medium: { bg: "#f59e0b", color: "#ffffff" },
      low: { bg: "#10b981", color: "#ffffff" },
    };
    return colors[risk] || colors.low;
  };

  return (
    <div style={patientCardStyle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 160px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* AVATAR */}
        <div style={avatarStyle}>
          <User size={32} style={{ color: "#3db5e6" }} />
        </div>

        {/* MAIN INFO */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {patient.name}
            <div
              style={{
                ...riskBadgeStyle,
                backgroundColor: getRiskBadge(patient.riskLevel).bg,
                color: getRiskBadge(patient.riskLevel).color,
              }}
            >
              {patient.riskLevel?.toUpperCase()}
            </div>
          </div>

          <div
            style={{ color: "#3db5e6", fontWeight: "600", fontSize: "0.95rem" }}
          >
            {patient.pid}
          </div>

          <div
            style={{
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📞 {patient.phone}
          </div>

          <div
            style={{
              backgroundColor: "#fef3c7",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              borderLeft: "4px solid #f59e0b",
              marginTop: "0.5rem",
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
            <div style={{ fontSize: "0.9rem", color: "#7c2d12" }}>
              {patient.aiSummary}
            </div>
          </div>
        </div>

        {/* STATS & ACTIONS */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "flex-end",
            }}
          >
            {/* Case Count */}
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
              <FileText
                size={16}
                style={{ display: "inline", marginRight: "0.25rem" }}
              />
              {patient.caseCount} cases
            </div>

            {/* Last Visit */}
            <div style={{ color: "#10b981", fontWeight: "600" }}>
              <Calendar
                size={16}
                style={{ display: "inline", marginRight: "0.25rem" }}
              />
              {patient.lastVisit}
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexDirection: "column",
              }}
            >
              <button style={actionButtonStyle("#3db5e6")}>
                👤 View Profile
              </button>
              <button style={actionButtonStyle("#8b5cf6")}>➕ New Case</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const patientCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "2.5rem",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  transition: "all 0.3s",
  cursor: "pointer",
  ":hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
  },
} as React.CSSProperties;

const avatarStyle = {
  width: "72px",
  height: "72px",
  borderRadius: "20px",
  backgroundColor: "#f0f9ff",
  display: "flex",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  boxShadow: "0 8px 20px rgba(61,181,230,0.15)",
} as const;

const riskBadgeStyle = {
  padding: "0.25rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "700",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
} as const;

const actionButtonStyle = (color: string) => ({
  width: "100%",
  padding: "0.75rem",
  backgroundColor: color,
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "0.85rem",
  cursor: "pointer",
  transition: "all 0.2s",
});

const statCardStyle = (accent: string, bg: string) => ({
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  padding: "1.25rem",
  backgroundColor: "#f8fafc",
  borderRadius: "16px",
  border: `1px solid ${bg}`,
});

// ADD THESE MISSING STYLES at the BOTTOM (before last });

const filterSectionStyle = {
  display: "flex",
  flexDirection: "column" as const,
} as const;

const searchSectionStyle = {
  display: "flex",
  alignItems: "center" as const,
} as const;

const statsSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
} as const;
