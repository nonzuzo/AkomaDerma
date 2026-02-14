import React, { useState } from "react";
import {
  Image,
  FileText,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  Clock,
  User,
  Calendar,
  Upload,
  Edit,
  Download,
  Share,
} from "lucide-react";

//  SHARED GRADIENT TITLE CONSISTENT
const gradientTitleStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold" as const,
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  margin: 0,
  lineHeight: 1.2,
};

export default function CaseDetails() {
  const [activeTab, setActiveTab] = useState("ai-analysis");

  const caseData = {
    id: "#45",
    patient: "John Doe (PID-000123)",
    created: "Feb 3, 2026 • 10:30 AM",
    status: "ai_analyzing",
    priority: "high",
    vitals: { bp: "120/80", pulse: "72", temp: "36.8°C", weight: "70kg" },
    complaint: "Chronic tinea versicolor - 3rd recurrence",
    symptoms: "Itching, scaling patches on chest/back",
    images: 3,
    aiConfidence: 92,
  };

  const aiResults = {
    topDiagnosis: "Tinea versicolor",
    confidence: "92%",
    risk: "low",
    recommendations: ["Topical antifungal", "Continue monitoring"],
    similarCases: 127,
  };

  return (
    <div style={pageContainer}>
      {/* HEADER WITH GRADIENT TITLE + STATUS */}
      <div style={headerSection}>
        <div>
          <h1 style={gradientTitleStyle}> {caseData.id} Case Details</h1>
          <p style={caseSubtitle}>
            {caseData.patient} • {caseData.created} •{" "}
            <span style={statusBadge(caseData.status)}>
              {caseData.status.replace("_", " ").toUpperCase()}
            </span>
          </p>
        </div>
        <div style={headerActions}>
          <button style={actionButton("#3db5e6")} title="Download Report">
            <Download size={20} />
          </button>
          <button style={actionButton("#10b981")} title="Share Case">
            <Share size={20} />
          </button>
          <button style={actionButton("#f59e0b")} title="Edit Case">
            <Edit size={20} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={tabsSection}>
        <button
          style={{
            ...tabButton,
            ...(activeTab === "ai-analysis" && tabActive),
          }}
          onClick={() => setActiveTab("ai-analysis")}
        >
          🤖 AI Analysis
        </button>
        <button
          style={{ ...tabButton, ...(activeTab === "clinical" && tabActive) }}
          onClick={() => setActiveTab("clinical")}
        >
          🩺 Clinical Data
        </button>
        <button
          style={{ ...tabButton, ...(activeTab === "images" && tabActive) }}
          onClick={() => setActiveTab("images")}
        >
          🖼️ Images ({caseData.images})
        </button>
        <button
          style={{ ...tabButton, ...(activeTab === "derm-notes" && tabActive) }}
          onClick={() => setActiveTab("derm-notes")}
        >
          👨‍⚕️ Derm Notes
        </button>
        <button style={tabButton}>📄 Treatment Plan</button>
      </div>

      {/* TAB CONTENT */}
      <div style={tabContent}>
        {activeTab === "ai-analysis" && <AIResultsTab aiResults={aiResults} />}
        {activeTab === "clinical" && <ClinicalTab caseData={caseData} />}
        {activeTab === "images" && <ImagesTab />}
        {activeTab === "derm-notes" && <DermNotesTab />}
      </div>
    </div>
  );
}

// TAB COMPONENTS
function AIResultsTab({ aiResults }) {
  return (
    <div style={gridContainer}>
      {/* AI DIAGNOSIS CARD */}
      <div style={primaryCard}>
        <div style={flexRow}>
          <TrendingUp size={32} style={{ color: "#10b981" }} />
          <div>
            <h3 style={cardTitle}>AI Diagnosis</h3>
            <div style={confidenceBar(aiResults.confidence)}>
              {aiResults.topDiagnosis} • {aiResults.confidence} confidence
            </div>
          </div>
        </div>
        <div style={aiRiskBadge(aiResults.risk)}>Risk: {aiResults.risk}</div>
      </div>

      {/* RECOMMENDATIONS */}
      <div style={infoCard}>
        <h3 style={sectionTitle}>AI Recommendations</h3>
        <ul style={recommendationsList}>
          {aiResults.recommendations.map((rec, i) => (
            <li key={i} style={recommendationItem}>
              <CheckCircle size={18} style={{ color: "#10b981" }} />
              {rec}
            </li>
          ))}
        </ul>
        <div style={similarCases}>
          <span>🔗 Similar cases found:</span>{" "}
          <strong>{aiResults.similarCases.toLocaleString()}</strong>
        </div>
      </div>

      {/* METRICS */}
      <div style={metricsGrid}>
        <MetricCard value="92%" label="AI Confidence" color="#10b981" />
        <MetricCard value="3.2s" label="Analysis Time" color="#3db5e6" />
        <MetricCard value="97%" label="Model Accuracy" color="#8b5cf6" />
      </div>
    </div>
  );
}

function ClinicalTab({ caseData }) {
  return (
    <div style={clinicalGrid}>
      <div style={vitalsCard}>
        <h3 style={sectionTitle}>📊 Vitals</h3>
        <div style={vitalsGrid}>
          <VitalItem label="BP" value={caseData.vitals.bp} />
          <VitalItem label="Pulse" value={caseData.vitals.pulse} />
          <VitalItem label="Temp" value={caseData.vitals.temp} />
          <VitalItem label="Weight" value={caseData.vitals.weight} />
        </div>
      </div>
      <div style={complaintCard}>
        <h3 style={sectionTitle}>🎯 Chief Complaint</h3>
        <p style={complaintText}>{caseData.complaint}</p>
        <p style={symptomsText}>{caseData.symptoms}</p>
      </div>
    </div>
  );
}

function ImagesTab() {
  return (
    <div style={imagesGrid}>
      {[1, 2, 3].map((i) => (
        <ImageCard key={i} caseNum={`#${45 + i}`} />
      ))}
      <UploadZone />
    </div>
  );
}

function DermNotesTab() {
  return (
    <div style={notesCard}>
      <div style={flexRow}>
        <User size={24} style={{ color: "#6b7280" }} />
        <div>
          <div style={dermName}>Dr. Ama Adu</div>
          <div style={dermStatus}>Dermatologist • Reviewing</div>
        </div>
      </div>
      <div style={notesEditor}>
        <textarea
          placeholder="Add dermatologist notes, treatment recommendations..."
          style={notesTextarea}
        />
        <div style={notesActions}>
          <button style={actionButton("#3db5e6")}>Save Notes</button>
          <button style={actionButton("#10b981")}>Generate Plan</button>
        </div>
      </div>
    </div>
  );
}

// UTILITY COMPONENTS
function MetricCard({ value, label, color }) {
  return (
    <div style={metricCard}>
      <div style={{ ...metricValue, color }}>{value}</div>
      <div style={metricLabel}>{label}</div>
    </div>
  );
}

function VitalItem({ label, value }) {
  return (
    <div style={vitalItem}>
      <span style={vitalLabel}>{label}</span>
      <span style={vitalValue}>{value}</span>
    </div>
  );
}

function ImageCard({ caseNum }) {
  return (
    <div style={imageCard}>
      <img
        src="/api/placeholder/300/300"
        alt="Skin lesion"
        style={imagePreview}
      />
      <div style={imageOverlay}>
        <Image size={20} style={{ color: "#3db5e6" }} />
        <span>{caseNum}</span>
      </div>
    </div>
  );
}

function UploadZone() {
  return (
    <div style={uploadZone}>
      <Upload size={48} style={{ color: "#9ca3af" }} />
      <h4 style={uploadTitle}>Add More Images</h4>
      <p style={uploadText}>Drag & drop or click to upload</p>
      <button style={browseButton}>Browse Files</button>
    </div>
  );
}

// All STYLES
const pageContainer = {
  padding: "2rem 0",
  maxWidth: "1400px",
  margin: "0 auto",
} as const;

const headerSection = {
  backgroundColor: "#ffffff",
  padding: "2.5rem",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "2rem",
} as const;

const caseSubtitle = {
  color: "#6b7280",
  fontSize: "1.1rem",
  marginTop: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
} as const;

const statusBadge = (status) => ({
  padding: "0.25rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: 600,
  ...(status === "ai_analyzing"
    ? {
        backgroundColor: "#fef3c7",
        color: "#d97706",
      }
    : status === "treatment_plan"
    ? {
        backgroundColor: "#d1fae5",
        color: "#065f46",
      }
    : {
        backgroundColor: "#f1f5f9",
        color: "#475569",
      }),
});

const headerActions = {
  display: "flex",
  gap: "1rem",
} as const;

const actionButton = (color) => ({
  padding: "0.75rem",
  backgroundColor: color + "20",
  color,
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
  ":hover": { backgroundColor: color, color: "#ffffff" },
});

const tabsSection = {
  backgroundColor: "#ffffff",
  padding: "1.5rem 2rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
  display: "flex",
  gap: "0.5rem",
  overflowX: "auto",
} as const;

const tabButton = {
  padding: "0.75rem 1.5rem",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  backgroundColor: "transparent",
  color: "#374151",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
} as const;

const tabActive = {
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  borderColor: "#3db5e6",
} as const;

const tabContent = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "2rem",
  minHeight: "600px",
} as const;

const gridContainer = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "2rem",
  marginBottom: "2rem",
} as const;

const primaryCard = {
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  color: "white",
  padding: "2.5rem",
  borderRadius: "20px",
  gridColumn: "1 / -1",
} as const;

const flexRow = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  marginBottom: "1.5rem",
} as const;

const cardTitle = {
  fontSize: "1.5rem",
  fontWeight: 700,
  margin: 0,
} as const;

const confidenceBar = (confidence) => ({
  backgroundColor: "rgba(255,255,255,0.2)",
  color: "white",
  padding: "0.5rem 1rem",
  borderRadius: "25px",
  fontSize: "1.1rem",
  fontWeight: 600,
});

const aiRiskBadge = (risk) => ({
  padding: "0.5rem 1.5rem",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "25px",
  fontSize: "0.95rem",
  fontWeight: 600,
});

const infoCard = {
  backgroundColor: "#f8fafc",
  padding: "2rem",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
} as const;

const sectionTitle = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: "1.5rem",
} as const;

const recommendationsList = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
} as const;
const recommendationItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.75rem",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  borderLeft: "4px solid #10b981",
} as const;

const similarCases = {
  marginTop: "1.5rem",
  padding: "1rem",
  backgroundColor: "#e0f2fe",
  borderRadius: "10px",
  textAlign: "center" as const,
};

const metricsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "1.5rem",
} as const;

const metricCard = {
  textAlign: "center" as const,
  padding: "1.5rem",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
} as const;

const metricValue = { fontSize: "1.75rem", fontWeight: 700 } as const;
const metricLabel = {
  fontSize: "0.875rem",
  color: "#6b7280",
  marginTop: "0.25rem",
} as const;

const clinicalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2rem",
} as const;
const vitalsCard = {
  backgroundColor: "#f8fafc",
  padding: "2rem",
  borderRadius: "16px",
} as const;
const vitalsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "1rem",
} as const;
const vitalItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "1rem",
  backgroundColor: "#ffffff",
  borderRadius: "10px",
} as const;
const vitalLabel = { fontWeight: 600, color: "#374151" } as const;
const vitalValue = { color: "#1e293b", fontWeight: 500 } as const;

const complaintCard = {
  padding: "2rem",
  backgroundColor: "#f8fafc",
  borderRadius: "16px",
} as const;
const complaintText = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: "1rem",
  lineHeight: 1.5,
} as const;
const symptomsText = { color: "#6b7280", lineHeight: 1.6 } as const;

const imagesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "2rem",
} as const;

const imageCard = {
  position: "relative" as const,
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
  height: 320,
} as const;

const imagePreview = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
} as const;
const imageOverlay = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0,0,0,0.85)",
  color: "white",
  padding: "1.25rem",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
} as const;

const uploadZone = {
  border: "3px dashed #d1d5db",
  borderRadius: "16px",
  padding: "4rem 2rem",
  textAlign: "center" as const,
  backgroundColor: "#fafbfc",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "1rem",
  cursor: "pointer",
} as const;

const uploadTitle = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#1e293b",
} as const;
const uploadText = { color: "#6b7280", marginBottom: "1.5rem" } as const;
const browseButton = {
  padding: "0.875rem 2rem",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  fontWeight: 600,
  cursor: "pointer",
} as const;

const notesCard = {
  padding: "2.5rem",
  backgroundColor: "#f8fafc",
  borderRadius: "20px",
  border: "1px solid #e5e7eb",
} as const;
const dermName = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#1e293b",
} as const;
const dermStatus = { fontSize: "0.9rem", color: "#6b7280" } as const;
const notesEditor = { marginTop: "2rem" } as const;
const notesTextarea = {
  width: "100%",
  minHeight: "200px",
  padding: "1.25rem",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  fontSize: "1rem",
  resize: "vertical",
  fontFamily: "inherit",
} as const;
const notesActions = {
  display: "flex",
  gap: "1rem",
  marginTop: "1.5rem",
} as const;
