// src/Components/Clinician/ClinicianCasesDashboard.tsx - % COMPLETE
import React, { useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Eye,
  MessageCircle,
} from "lucide-react";

// GRADIENT TITLE STYLE
const gradientTitleStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold" as const,
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  margin: 0,
  lineHeight: 1.2,
};

export default function ClinicianCasesDashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const cases = [
    {
      id: "#45",
      patient: "John Doe (PID-000123)",
      date: "Feb 3, 2026",
      status: "ai_analyzing",
      priority: "high",
      aiSummary: "Chronic tinea versicolor recurrence",
      images: 3,
      specialist: null,
    },
    {
      id: "#46",
      patient: "Grace Mensah (PID-000456)",
      date: "Feb 2, 2026",
      status: "treatment_plan",
      priority: "medium",
      aiSummary: "Acne vulgaris - hormonal confirmed",
      images: 4,
      specialist: "Dr. Adu",
    },
    {
      id: "#44",
      patient: "Kwame Boateng (PID-000789)",
      date: "Jan 30, 2026",
      status: "completed",
      priority: "low",
      aiSummary: "Eczema controlled",
      images: 2,
      specialist: "Dr. Adu",
    },
  ];

  const filteredCases = cases.filter(
    (c) =>
      c.patient.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || c.status.includes(filter))
  );

  const statusCounts = {
    ai_analyzing: cases.filter((c) => c.status === "ai_analyzing").length,
    treatment_plan: cases.filter((c) => c.status === "treatment_plan").length,
    completed: cases.filter((c) => c.status === "completed").length,
  };

  return (
    <div style={dashboardContainer}>
      {/* HEADER */}
      <div style={headerSection}>
        <div>
          <h1 style={gradientTitleStyle}>My Cases</h1>
          <p style={pageSubtitle}>Case management & AI analysis</p>
        </div>
        <div style={statsRow}>
          <StatCard
            count={statusCounts.ai_analyzing}
            label="AI Analyzing"
            color="#3b82f6"
          />
          <StatCard
            count={statusCounts.treatment_plan}
            label="Treatment Ready"
            color="#10b981"
          />
          <StatCard
            count={statusCounts.completed}
            label="Completed"
            color="#6b7280"
          />
        </div>
      </div>

      {/* CONTROLS */}
      <div style={controlsSection}>
        <div style={searchSection}>
          <Search size={18} style={searchIcon} />
          <input
            style={searchInput}
            placeholder="Search cases by patient name or PID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={filterSection}>
          <div style={filterTabs}>
            {[
              { id: "all", label: "All Cases", count: cases.length },
              {
                id: "ai_analyzing",
                label: "AI Analyzing",
                count: statusCounts.ai_analyzing,
              },
              {
                id: "treatment_plan",
                label: "Treatment Ready",
                count: statusCounts.treatment_plan,
              },
              {
                id: "completed",
                label: "Completed",
                count: statusCounts.completed,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                style={{
                  ...filterTab,
                  ...(filter === tab.id ? filterTabActive : {}),
                }}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label} <span style={tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          style={newCaseButton}
          onClick={() => alert("Go to Create Case")}
        >
          ➕ New Case
        </button>
      </div>

      {/* CASES TABLE */}
      <div style={tableContainer}>
        <div style={tableHeader}>
          <span>Case #</span>
          <span>Patient</span>
          <span>Date</span>
          <span>AI Summary</span>
          <span>Images</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredCases.length === 0 ? (
          <EmptyState />
        ) : (
          filteredCases.map((caseItem) => (
            <CaseRow key={caseItem.id} caseItem={caseItem} />
          ))
        )}
      </div>
    </div>
  );
}

// COMPONENTS
function StatCard({ count, label, color }) {
  return (
    <div style={statCard(color)}>
      <div style={{ ...statCount, color }}>{count}</div>
      <div style={statLabel}>{label}</div>
    </div>
  );
}

function CaseRow({ caseItem }) {
  return (
    <div style={tableRow}>
      <div style={caseId}>{caseItem.id}</div>
      <div style={patientCell}>{caseItem.patient}</div>
      <div style={dateCell}>{caseItem.date}</div>
      <div style={summaryCell}>{caseItem.aiSummary}</div>
      <div style={imagesCell}>{caseItem.images}</div>
      <div style={statusCell(caseItem.status)}>
        {caseItem.status.replace("_", " ").toUpperCase()}
      </div>
      <div style={actionsCell}>
        <button style={actionBtn("view")}>
          <Eye size={16} />
        </button>
        <button style={actionBtn("chat")}>
          <MessageCircle size={16} />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={emptyState}>
      <TrendingUp size={64} style={{ opacity: 0.3, color: "#6b7280" }} />
      <h3 style={emptyTitle}>No cases match your filters</h3>
      <p style={emptySubtitle}>
        Create your first case or adjust filters above
      </p>
    </div>
  );
}

// ALL styles

const dashboardContainer = {
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

const pageTitle = {
  fontSize: "2.25rem",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
} as const;

const pageSubtitle = {
  color: "#6b7280",
  fontSize: "1.1rem",
  marginTop: "0.5rem",
} as const;

const statsRow = { display: "flex", gap: "2rem" } as const;

const statCard = (color) =>
  ({
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: `1px solid ${color === "#3db5e6" ? "#3db5e620" : color + "20"}`,
    textAlign: "center" as const,
  } as any);

const statCount = { fontSize: "2rem", fontWeight: 700 } as const;

const statLabel = {
  fontSize: "0.875rem",
  color: "#6b7280",
  fontWeight: 500,
} as const;

const controlsSection = {
  backgroundColor: "#ffffff",
  padding: "2rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
  display: "grid",
  gridTemplateColumns: "2fr 1fr auto",
  gap: "1.5rem",
  alignItems: "end",
} as const;

const searchSection = { position: "relative" } as const;

const searchIcon = {
  position: "absolute" as const,
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
} as const;

const searchInput = {
  width: "100%",
  padding: "1rem 1rem 1rem 3.5rem",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "0.95rem",
} as const;

const filterSection = {} as const;

const filterTabs = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
} as const;

const filterTab = {
  padding: "0.75rem 1.25rem",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  backgroundColor: "transparent",
  color: "#374151",
  fontWeight: 500,
  cursor: "pointer",
} as const;

const filterTabActive = {
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  borderColor: "#3db5e6",
} as const;

const tabCount = {
  backgroundColor: "#ffffff",
  color: "#374151",
  padding: "0.125rem 0.5rem",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: 600,
  marginLeft: "0.5rem",
} as const;

const newCaseButton = {
  padding: "1rem 2rem",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
} as const;

const tableContainer = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
} as const;

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "80px 2fr 120px 2fr 80px 160px 120px",
  gap: "1rem",
  padding: "1.5rem 2rem",
  backgroundColor: "#f8fafc",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  borderBottom: "2px solid #e5e7eb",
} as const;

const tableRow = {
  display: "grid",
  gridTemplateColumns: "80px 2fr 120px 2fr 80px 160px 120px",
  gap: "1rem",
  padding: "1.5rem 2rem",
  borderBottom: "1px solid #f9fafb",
  cursor: "pointer",
  ":hover": { backgroundColor: "#f8fafc" } as any,
} as const;

const caseId = {
  fontWeight: 700,
  color: "#3db5e6",
  fontSize: "1.1rem",
} as const;

const patientCell = { fontWeight: 500, color: "#111827" } as const;

const dateCell = { color: "#6b7280", fontSize: "0.9rem" } as const;

const summaryCell = { color: "#374151", fontSize: "0.95rem" } as const;

const imagesCell = {
  backgroundColor: "#f0f9ff",
  color: "#0369a1",
  padding: "0.5rem 1rem",
  borderRadius: "20px",
  fontWeight: 600,
  textAlign: "center" as const,
} as const;

const statusCell = (status) =>
  ({
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 600,
    textAlign: "center" as const,
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
  } as any);

const actionsCell = {
  display: "flex",
  gap: "0.5rem",
  justifyContent: "flex-end",
} as const;

const actionBtn = (type) =>
  ({
    padding: "0.5rem",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...(type === "view" ? { color: "#3db5e6" } : { color: "#10b981" }),
  } as any);

const emptyState = {
  padding: "4rem 2rem",
  textAlign: "center" as const,
  color: "#6b7280",
} as const;

const emptyTitle = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#374151",
  margin: "1rem 0 0.5rem 0",
} as const;

const emptySubtitle = { fontSize: "0.95rem", margin: 0 } as const;
