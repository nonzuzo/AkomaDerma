// src/Components/Clinician/ClinicianCasesDashboard.tsx
// Accessed from:
//   Sidebar "Cases" nav item            → shows all cases (no filter)
//   Dashboard "Sent to Derm" card       → ?filter=sent_to_derm
//   Dashboard "Treatment Ready" card    → ?filter=treatment_ready
//   Dashboard "Completed" card          → ?filter=completed
// Treatment-ready rows show a Payment button → /clinician/billing/new

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CreditCard,
  Plus,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}`;
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
type CaseStatus = "draft" | "sent_to_derm" | "treatment_ready" | "completed";

interface CaseItem {
  case_id: number;
  patient_id: number;
  patient_name: string;
  chief_complaint: string;
  lesion_location: string;
  status: CaseStatus;
  created_at: string;
  image_count: number;
}

// ─── Status config — matches your DB ENUM exactly ─────────────────────────────
const STATUS_CONFIG: Record<
  CaseStatus,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  draft: { label: "Draft", color: "#64748b", bg: "#f1f5f9" },
  sent_to_derm: { label: "Sent to Derm", color: "#d97706", bg: "#fef3c7" },
  treatment_ready: {
    label: "Treatment Ready",
    color: "#059669",
    bg: "#d1fae5",
  },
  completed: { label: "Completed", color: "#3b82f6", bg: "#dbeafe" },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All Cases", icon: FileText },
  { key: "draft", label: "Drafts", icon: Clock },
  { key: "sent_to_derm", label: "Sent to Derm", icon: Send },
  { key: "treatment_ready", label: "Treatment Ready", icon: AlertCircle },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClinicianCasesDashboard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [filtered, setFiltered] = useState<CaseItem[]>([]);
  const [activeTab, setActiveTab] = useState(params.get("filter") || "all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sync tab when URL param changes (dashboard card clicks update params)
  useEffect(() => {
    setActiveTab(params.get("filter") || "all");
  }, [params]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/clinicians/cases`, { headers: auth() });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCases(data.cases || []);
      setLastUpdated(new Date());
    } catch {
      setError("Could not load cases. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // ── Filter + search ───────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...cases];
    if (activeTab !== "all") {
      result = result.filter((c) => c.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.patient_name.toLowerCase().includes(q) ||
          c.chief_complaint?.toLowerCase().includes(q) ||
          String(c.case_id).includes(q)
      );
    }
    setFiltered(result);
  }, [cases, activeTab, search]);

  // ── Count helpers ─────────────────────────────────────────────────────────
  const count = (key: string) =>
    key === "all" ? cases.length : cases.filter((c) => c.status === key).length;

  // ── Loading screen — matches dashboard loading ─────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <div style={{ color: "#64748b", fontSize: "1rem", marginTop: "1rem" }}>
          Loading cases...
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* ── Error banner — same as dashboard ── */}
      {error && (
        <div style={s.errorBanner}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={s.retryBtn} onClick={fetchCases}>
            Retry
          </button>
        </div>
      )}

      {/* ── Page header ── */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>My Cases</h1>
          <p style={s.subheader}>
            Case management and teleconsultation workflow
            {lastUpdated && (
              <span style={s.updatedTag}>
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-GH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button style={s.refreshBtn} onClick={fetchCases}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            style={s.primaryBtn}
            onClick={() => navigate("/clinician/create-case")}
          >
            <Plus size={15} />
            New Case
          </button>
        </div>
      </div>

      {/* ── Stat cards — same design as dashboard StatCard ── */}
      <div style={s.statsGrid}>
        <StatCard
          icon={<FileText size={28} />}
          accent="#3db5e6"
          bg="#e0f2fe"
          title="Total Cases"
          value={count("all")}
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <StatCard
          icon={<Send size={28} />}
          accent="#f59e0b"
          bg="#fef3c7"
          title="With Dermatologist"
          value={count("sent_to_derm")}
          active={activeTab === "sent_to_derm"}
          onClick={() => setActiveTab("sent_to_derm")}
        />
        <StatCard
          icon={<AlertCircle size={28} />}
          accent="#10b981"
          bg="#d1fae5"
          title="Treatment Ready"
          value={count("treatment_ready")}
          highlight={count("treatment_ready") > 0}
          active={activeTab === "treatment_ready"}
          onClick={() => setActiveTab("treatment_ready")}
        />
        <StatCard
          icon={<CheckCircle size={28} />}
          accent="#3b82f6"
          bg="#dbeafe"
          title="Completed"
          value={count("completed")}
          active={activeTab === "completed"}
          onClick={() => setActiveTab("completed")}
        />
      </div>

      {/* ── Contextual banner for treatment_ready ── */}
      {activeTab === "treatment_ready" && count("treatment_ready") > 0 && (
        <div style={s.greenBanner}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>
              {count("treatment_ready")} case
              {count("treatment_ready") !== 1 ? "s" : ""}
            </strong>{" "}
            have a completed diagnosis. Click <strong>Payment</strong> on each
            case to start billing and close the case.
          </span>
        </div>
      )}

      {/* ── Contextual banner for sent_to_derm ── */}
      {activeTab === "sent_to_derm" && count("sent_to_derm") > 0 && (
        <div style={s.yellowBanner}>
          <Send size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>
              {count("sent_to_derm")} case
              {count("sent_to_derm") !== 1 ? "s" : ""}
            </strong>{" "}
            are currently with the dermatologist. You will be notified when a
            diagnosis is ready.
          </span>
        </div>
      )}

      {/* ── Controls card — filter tabs + search ── */}
      <div style={s.controlsCard}>
        <div style={s.tabsRow}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              style={{
                ...s.tabBtn,
                ...(activeTab === key ? s.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={13} />
              {label}
              <span
                style={{
                  ...s.tabBadge,
                  ...(activeTab === key ? s.tabBadgeActive : {}),
                }}
              >
                {count(key)}
              </span>
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <Search size={15} style={s.searchIcon} />
          <input
            style={s.searchInput}
            placeholder="Search by patient name, complaint, or case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch("")}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <EmptyState
          tabKey={activeTab}
          onNewCase={() => navigate("/clinician/create-case")}
        />
      ) : (
        <div style={s.tableCard}>
          {/* Head */}
          <div style={s.tableHead}>
            <span>Case</span>
            <span>Patient</span>
            <span>Complaint</span>
            <span>Date</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {/* Rows */}
          {filtered.map((c) => (
            <CaseRow
              key={c.case_id}
              item={c}
              onView={() => navigate(`/clinician/cases/${c.case_id}`)}
              onPatient={() => navigate(`/clinician/patients/${c.patient_id}`)}
              onPayment={() =>
                navigate(
                  `/clinician/billing/new?case_id=${c.case_id}&patient_id=${c.patient_id}`
                )
              }
            />
          ))}

          <p style={s.resultNote}>
            Showing {filtered.length} of {cases.length} case
            {cases.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Stat card — same structure as dashboard ─────────────────────────────────
function StatCard({
  icon,
  title,
  value,
  accent,
  bg,
  highlight,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  accent: string;
  bg: string;
  highlight?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...s.statCard,
        boxShadow: highlight
          ? `0 0 0 2px ${accent}, 0 4px 12px rgba(0,0,0,0.08)`
          : active
          ? `0 0 0 2px ${accent}60, 0 4px 12px rgba(0,0,0,0.06)`
          : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...s.statIcon, backgroundColor: bg, color: accent }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={s.statLabel}>{title}</div>
        <div style={{ ...s.statValue, color: highlight ? accent : "#111827" }}>
          {value}
        </div>
      </div>
      {highlight && (
        <div style={{ ...s.pill, backgroundColor: accent }}>Action needed</div>
      )}
    </div>
  );
}

// ─── Case row ─────────────────────────────────────────────────────────────────
function CaseRow({
  item,
  onView,
  onPatient,
  onPayment,
}: {
  item: CaseItem;
  onView: () => void;
  onPatient: () => void;
  onPayment: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;

  return (
    <div
      style={{
        ...s.tableRow,
        backgroundColor: hovered ? "#f8fafc" : "#ffffff",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Case ID + image count */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <span style={s.caseIdText}>#{item.case_id}</span>
        {item.image_count > 0 && (
          <span style={s.imgBadge}>
            <ImageIcon size={10} />
            {item.image_count} img
          </span>
        )}
      </div>

      {/* Patient — clickable to profile */}
      <div style={{ cursor: "pointer" }} onClick={onPatient}>
        <div style={s.patientName}>{item.patient_name}</div>
        <div style={s.patientPid}>
          PID-{String(item.patient_id).padStart(6, "0")}
        </div>
      </div>

      {/* Complaint + location */}
      <div>
        <div style={s.complaintText}>{item.chief_complaint || "—"}</div>
        {item.lesion_location && (
          <div style={s.locationText}>{item.lesion_location}</div>
        )}
      </div>

      {/* Date */}
      <span style={s.dateText}>{formatDate(item.created_at)}</span>

      {/* Status badge */}
      <span
        style={{ ...s.statusBadge, color: sc.color, backgroundColor: sc.bg }}
      >
        {sc.label}
      </span>

      {/* Actions */}
      <div style={s.actionsCell}>
        <button title="View case details" style={s.iconBtn} onClick={onView}>
          <Eye size={15} />
        </button>
        {item.status === "treatment_ready" && (
          <button
            title="Proceed to payment"
            style={s.payBtn}
            onClick={onPayment}
          >
            <CreditCard size={14} />
            Payment
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  tabKey,
  onNewCase,
}: {
  tabKey: string;
  onNewCase: () => void;
}) {
  const copy: Record<string, { title: string; sub: string }> = {
    all: {
      title: "No cases yet",
      sub: "Create your first case to begin the teleconsultation workflow.",
    },
    draft: {
      title: "No draft cases",
      sub: "Cases you have started but not submitted will appear here.",
    },
    sent_to_derm: {
      title: "No cases with the dermatologist",
      sub: "Submitted cases will appear here while awaiting review.",
    },
    treatment_ready: {
      title: "No treatment-ready cases",
      sub: "Cases appear here once the dermatologist sends a diagnosis.",
    },
    completed: {
      title: "No completed cases",
      sub: "Fully billed and closed cases will appear here.",
    },
  };
  const { title, sub } = copy[tabKey] ?? copy.all;

  return (
    <div style={s.emptyBox}>
      <FileText size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
      <h3 style={s.emptyTitle}>{title}</h3>
      <p style={s.emptySub}>{sub}</p>
      {tabKey === "all" && (
        <button style={s.primaryBtn} onClick={onNewCase}>
          <Plus size={14} />
          Create First Case
        </button>
      )}
    </div>
  );
}

// ─── Styles — mirrors the dashboard s object exactly ─────────────────────────
const GRID = "70px 1.4fr 1.6fr 110px 145px 160px";

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "2rem 1.5rem",
    maxWidth: "1400px",
    margin: "0 auto",
    boxSizing: "border-box",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
  },

  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.9rem 1.25rem",
    borderRadius: "12px",
    borderLeft: "4px solid #ef4444",
    marginBottom: "1.5rem",
  },

  retryBtn: {
    background: "#3db5e6",
    color: "white",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },

  // ── Header ──
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },

  pageTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
    fontWeight: 700,
    background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    lineHeight: 1.3,
  },

  subheader: {
    color: "#64748b",
    fontSize: "0.9rem",
    margin: "0.35rem 0 0 0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },

  updatedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 600,
  },

  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1.2rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    background: "white",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
  },

  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1.25rem",
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
  },

  // ── Stat cards — identical to dashboard ──
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.25rem 1.5rem",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    border: "1px solid #f1f5f9",
    position: "relative",
    overflow: "hidden",
  },

  statIcon: {
    width: 52,
    height: 52,
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  statLabel: { fontSize: "0.78rem", color: "#64748b", fontWeight: 500 },
  statValue: { fontSize: "1.9rem", fontWeight: 700, lineHeight: 1.1 },

  pill: {
    position: "absolute",
    top: "0.6rem",
    right: "0.6rem",
    color: "white",
    fontSize: "0.62rem",
    fontWeight: 700,
    padding: "0.2rem 0.5rem",
    borderRadius: "20px",
  },

  // ── Banners ──
  greenBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    backgroundColor: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: "12px",
    padding: "0.875rem 1.25rem",
    fontSize: "0.875rem",
    color: "#065f46",
    marginBottom: "1.25rem",
  },

  yellowBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "12px",
    padding: "0.875rem 1.25rem",
    fontSize: "0.875rem",
    color: "#92400e",
    marginBottom: "1.25rem",
  },

  // ── Controls card — same as dashboard card ──
  controlsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "1.5rem 1.75rem",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    marginBottom: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },

  tabsRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },

  tabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.55rem 1rem",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    backgroundColor: "transparent",
    color: "#374151",
    fontSize: "0.83rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },

  tabBtnActive: {
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    borderColor: "#3db5e6",
  },

  tabBadge: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.1rem 0.45rem",
    borderRadius: "20px",
    minWidth: "1.2rem",
    textAlign: "center",
  },

  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
    color: "#ffffff",
  },

  searchIcon: {
    position: "absolute",
    left: "0.9rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
  },

  searchInput: {
    width: "100%",
    padding: "0.85rem 1rem 0.85rem 2.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "0.92rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },

  clearBtn: {
    position: "absolute",
    right: "0.9rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#9ca3af",
    fontSize: "0.8rem",
    cursor: "pointer",
  },

  // ── Table — inside a dashboard-style card ──
  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  tableHead: {
    display: "grid",
    gridTemplateColumns: GRID,
    gap: "1rem",
    padding: "1rem 1.75rem",
    backgroundColor: "#f8fafc",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e5e7eb",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: GRID,
    gap: "1rem",
    padding: "1rem 1.75rem",
    borderBottom: "1px solid #f3f4f6",
    alignItems: "center",
    transition: "background-color 0.15s",
  },

  caseIdText: {
    fontWeight: 700,
    color: "#3db5e6",
    fontSize: "0.95rem",
  },

  imgBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.7rem",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "0.1rem 0.4rem",
    borderRadius: "10px",
    width: "fit-content",
  },

  patientName: { fontWeight: 600, color: "#111827", fontSize: "0.9rem" },
  patientPid: { fontSize: "0.75rem", color: "#9ca3af" },
  complaintText: { fontSize: "0.875rem", color: "#374151" },
  locationText: { fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.1rem" },
  dateText: { fontSize: "0.825rem", color: "#64748b" },

  statusBadge: {
    display: "inline-block",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.7rem",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },

  actionsCell: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
    color: "#3db5e6",
    border: "none",
    borderRadius: "8px",
    padding: "0.45rem",
    cursor: "pointer",
  },

  payBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    backgroundColor: "#d1fae5",
    color: "#059669",
    border: "none",
    borderRadius: "8px",
    padding: "0.45rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // ── Empty state ──
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4rem 2rem",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    textAlign: "center",
  },

  emptyTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#374151",
    margin: "0 0 0.5rem 0",
  },

  emptySub: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    margin: "0 0 1.5rem 0",
    maxWidth: "360px",
  },

  resultNote: {
    fontSize: "0.8rem",
    color: "#9ca3af",
    textAlign: "center",
    margin: "0.875rem 0",
  },
};
