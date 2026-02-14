// src/Components/Clinician/ClinicianPatientProfile.tsx
import React from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Calendar,
  TrendingUp,
  FileText,
  Phone,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function ClinicianPatientProfile() {
  const { pid } = useParams();

  // DYNAMIC PATIENT DATA
  const patientData =
    pid === "PID-000123"
      ? {
          name: "John Doe",
          pid: "PID-000123",
          phone: "+233 244 567 890",
          dob: "May 15, 1990",
          gender: "Male",
          clinicId: "CL-247",
          risk: "high",
          cases: 3,
          lastVisit: "Feb 3, 2026",
          aiSummary:
            "Chronic tinea versicolor patient with 3 recurrences in 12 months. Responds well to topical antifungals (Clotrimazole 1%). High recurrence risk during humid season. No documented allergies.",
          vitals: { bp: "120/80", pulse: "72", temp: "36.8", weight: "70" },
        }
      : {
          name: "Grace Mensah",
          pid: "PID-000456",
          phone: "+233 245 678 901",
          dob: "Aug 22, 1995",
          gender: "Female",
          clinicId: "CL-248",
          risk: "medium",
          cases: 1,
          lastVisit: "Feb 1, 2026",
          aiSummary:
            "Acne vulgaris - hormonal pattern. Moderate scarring risk. Responds to topical retinoids.",
          vitals: { bp: "118/76", pulse: "68", temp: "36.7", weight: "62" },
        };

  return (
    <div style={profilePageContainer}>
      {/* HEADER */}
      <div style={profileHeader}>
        <div style={profileHeaderLeft}>
          <div style={avatarLarge}>
            {patientData.name.split(" ")[0][0]}
            {patientData.name.split(" ").pop()?.[0] || ""}
          </div>
          <div>
            <h1 style={patientFullName}>{patientData.name}</h1>
            <div style={patientIdTag}>{patientData.pid}</div>
            <div style={riskStatus(patientData.risk)}>
              {patientData.risk === "high" ? "HIGH RISK PATIENT" : "MONITOR"}
            </div>
          </div>
        </div>
        <div style={profileHeaderRight}>
          <div style={lastVisitInfo}>
            <Calendar size={16} />
            <span>Last visit: {patientData.lastVisit}</span>
          </div>
          <div style={caseCountInfo}>
            <FileText size={16} />
            <span>{patientData.cases} Total Cases</span>
          </div>
        </div>
      </div>

      {/* AI SUMMARY */}
      <div style={aiSummaryCard}>
        <div style={aiHeader}>
          <TrendingUp size={20} style={{ color: "#3b82f6" }} />
          <h2 style={aiTitle}>AI Clinical Summary</h2>
        </div>
        <div style={aiContent}>
          <p style={aiMainText}>{patientData.aiSummary}</p>
          <div style={aiRecommendations}>
            <div style={recommendationItem}>
              <CheckCircle size={16} style={{ color: "#10b981" }} />
              <span>Prophylactic antifungals recommended</span>
            </div>
            <div style={recommendationItem}>
              <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
              <span>Monitor for scarring</span>
            </div>
          </div>
        </div>
      </div>

      {/* EHR SECTIONS */}
      <div style={ehrSections}>
        <div style={ehrCard}>
          <h3 style={sectionTitle}>Demographics</h3>
          <div style={demoGrid}>
            <div style={demoItem}>
              <label>Phone</label>
              <div style={demoValue}>
                <Phone size={16} /> {patientData.phone}
              </div>
            </div>
            <div style={demoItem}>
              <label>Date of Birth</label>
              <div style={demoValue}>{patientData.dob}</div>
            </div>
            <div style={demoItem}>
              <label>Gender</label>
              <div style={demoValue}>{patientData.gender}</div>
            </div>
            <div style={demoItem}>
              <label>Clinic ID</label>
              <div style={demoValue}>{patientData.clinicId}</div>
            </div>
          </div>
        </div>

        <div style={ehrCard}>
          <h3 style={sectionTitle}>Recent Vitals</h3>
          <div style={vitalsGrid}>
            <div style={vitalItem}>
              <div style={vitalLabel}>BP</div>
              <div style={vitalValue}>{patientData.vitals.bp}</div>
            </div>
            <div style={vitalItem}>
              <div style={vitalLabel}>Pulse</div>
              <div style={vitalValue}>{patientData.vitals.pulse} bpm</div>
            </div>
            <div style={vitalItem}>
              <div style={vitalLabel}>Temp</div>
              <div style={vitalValue}>{patientData.vitals.temp}°C</div>
            </div>
            <div style={vitalItem}>
              <div style={vitalLabel}>Weight</div>
              <div style={vitalValue}>{patientData.vitals.weight} kg</div>
            </div>
          </div>
        </div>
      </div>

      {/* CASE HISTORY */}
      <div style={ehrCardFull}>
        <h3 style={sectionTitle}>Case History</h3>
        <div style={casesTable}>
          <div style={tableRowHeader}>
            <span>Case #</span>
            <span>Date</span>
            <span>Diagnosis</span>
            <span>Treatment</span>
            <span>Status</span>
          </div>
          {caseHistory.map((caseItem, index) => (
            <div key={index} style={tableRow}>
              <span style={caseNumber}>{caseItem.case}</span>
              <span>{caseItem.date}</span>
              <span>{caseItem.diagnosis}</span>
              <span>{caseItem.treatment}</span>
              <span style={statusTag(caseItem.status)}>{caseItem.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={actionsCard}>
        <h3 style={sectionTitle}>Quick Actions</h3>
        <div style={actionsGrid}>
          <button style={actionButtonPrimary}>➕ Create New Case</button>
          <button style={actionButtonSecondary}>📅 Schedule Follow-up</button>
          <button style={actionButtonSecondary}>📝 Update Vitals</button>
          <button style={actionButtonSecondary}>📤 Print Summary</button>
        </div>
      </div>
    </div>
  );
}

// DATA
const caseHistory = [
  {
    case: "#45",
    date: "Feb 3, 2026",
    diagnosis: "Tinea versicolor",
    treatment: "Clotrimazole 1%",
    status: "Treatment Ready",
  },
  {
    case: "#23",
    date: "Dec 15, 2025",
    diagnosis: "Tinea versicolor",
    treatment: "Clotrimazole 1%",
    status: "Completed",
  },
  {
    case: "#12",
    date: "Sep 20, 2025",
    diagnosis: "Acne",
    treatment: "Benzoyl peroxide",
    status: "Completed",
  },
];

// STYLES (Your existing + 2 MISSING)
const profilePageContainer = { padding: "2rem 0" } as const;
const profileHeader = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "2.5rem",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "2rem",
} as const;
const profileHeaderLeft = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  flex: 1,
} as const;
const avatarLarge = {
  width: 80,
  height: 80,
  borderRadius: "16px",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  display: "flex",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  fontSize: "1.5rem",
  fontWeight: 700,
} as const;
const patientFullName = {
  fontSize: "2rem",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
  lineHeight: 1.2,
} as const;
const patientIdTag = {
  backgroundColor: "#f3f4f6",
  color: "#6b7280",
  padding: "0.25rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: 500,
  display: "inline-block",
  marginTop: "0.5rem",
} as const;
const riskStatus = (risk) => ({
  backgroundColor: risk === "high" ? "#fef2f2" : "#f0fdf4",
  color: risk === "high" ? "#dc2626" : "#166534",
  padding: "0.375rem 1rem",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  border: `1px solid ${risk === "high" ? "#fecaca" : "#bbf7d0"}`,
  marginTop: "0.75rem",
});
const profileHeaderRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "1rem",
} as const;
const lastVisitInfo = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "#6b7280",
  fontSize: "0.95rem",
} as const;
const caseCountInfo = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "#374151",
  fontWeight: 600,
  fontSize: "1rem",
} as const;
const aiSummaryCard = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  padding: "2rem",
  marginBottom: "2rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
} as const;
const aiHeader = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  marginBottom: "1.25rem",
} as const;
const aiTitle = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#111827",
  margin: 0,
} as const;
const aiContent = {} as const;
const aiMainText = {
  fontSize: "1rem",
  lineHeight: 1.6,
  color: "#374151",
  marginBottom: "1.5rem",
} as const;
const aiRecommendations = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
} as const;
const recommendationItem = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  fontSize: "0.95rem",
  color: "#374151",
} as const;
const ehrSections = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
  marginBottom: "2rem",
} as const;
const ehrCard = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "1.75rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
} as const;
const sectionTitle = {
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "#111827",
  marginBottom: "1.25rem",
  paddingBottom: "0.5rem",
  borderBottom: "2px solid #f3f4f6",
} as const;
const demoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
} as const;
const demoItem = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
} as const;
const demoValue = {
  fontSize: "0.95rem",
  color: "#374151",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
} as const;
const vitalsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "1rem",
} as const;
const vitalItem = {
  textAlign: "center" as const,
  padding: "1rem 0.5rem",
} as const;
const vitalLabel = {
  fontSize: "0.8rem",
  color: "#6b7280",
  marginBottom: "0.25rem",
} as const;
const vitalValue = {
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "#111827",
} as const;
const ehrCardFull = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "1.75rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  gridColumn: "1 / -1",
} as const;
const casesTable = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "0.75rem",
} as const;
const tableRowHeader = {
  display: "grid",
  gridTemplateColumns: "80px 120px 1fr 1fr 140px",
  gap: "1rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  paddingBottom: "0.75rem",
  borderBottom: "2px solid #f3f4f6",
  letterSpacing: "0.05em",
} as const;
const tableRow = {
  display: "grid",
  gridTemplateColumns: "80px 120px 1fr 1fr 140px",
  gap: "1rem",
  padding: "1rem 0",
  fontSize: "0.9rem",
  borderBottom: "1px solid #f9fafb",
} as const;
const caseNumber = {
  fontWeight: 700,
  color: "#3b82f6",
  fontSize: "1rem",
} as const;
const statusTag = (status) => ({
  padding: "0.25rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: 600,
  ...(status === "Treatment Ready"
    ? { backgroundColor: "#dcfce7", color: "#166534" }
    : { backgroundColor: "#f3f4f6", color: "#374151" }),
});
const actionsCard = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "1.75rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
} as const;
const actionsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "1rem",
} as const;
const actionButtonPrimary = {
  padding: "0.875rem 1.25rem",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.9rem",
  fontWeight: 500,
  cursor: "pointer",
} as const;
const actionButtonSecondary = {
  padding: "0.875rem 1.25rem",
  backgroundColor: "transparent",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "0.9rem",
  fontWeight: 500,
  cursor: "pointer",
} as const;
