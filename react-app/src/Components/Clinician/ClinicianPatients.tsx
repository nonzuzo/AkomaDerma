// src/Components/Clinician/ClinicianPatients.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  User,
  FileText,
  Calendar,
  Plus,
  Activity,
  Phone,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}`;
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  contact_info: string;
  occupation: string | null;
  is_walkin: number;
  created_at: string;
  case_count: number;
}

type FilterKey = "all" | "walkin" | "repeat";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Patients" },
  { key: "walkin", label: "Walk-ins" },
  { key: "repeat", label: "Repeat Visits" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  return (
    (parts[0]?.[0] || "P").toUpperCase() + (parts[1]?.[0] || "").toUpperCase()
  );
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const calcAge = (dob: string | null) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
};

// ─── Deterministic avatar colour per patient ──────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#e0f2fe", color: "#0369a1" },
  { bg: "#d1fae5", color: "#065f46" },
  { bg: "#ede9fe", color: "#5b21b6" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#fef3c7", color: "#92400e" },
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClinicianPatients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/clinicians/patients?filter=${filter}`, {
        headers: auth(),
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch {
      setError("Failed to load patients. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Client-side search ───────────────────────────────────────────────────
  const searched = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.contact_info.toLowerCase().includes(q) ||
      String(p.patient_id).includes(q)
    );
  });

  // ── Repeat filter applied client-side ────────────────────────────────────
  const displayed =
    filter === "repeat" ? searched.filter((p) => p.case_count > 1) : searched;

  // ── Summary stats ────────────────────────────────────────────────────────
  const totalPatients = patients.length;
  const walkInCount = patients.filter((p) => p.is_walkin).length;
  const withCases = patients.filter((p) => p.case_count > 0).length;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <div style={{ color: "#64748b", marginTop: "1rem" }}>
          Loading patients...
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* ── Page heading ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Patient Records</h1>
          <p style={s.pageSubtitle}>All patients registered at your clinic</p>
        </div>
        <button
          style={s.newPatientBtn}
          onClick={() => navigate("/clinician/create-case")}
        >
          <Plus size={16} />
          New Patient
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={s.errorBanner}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={s.retryBtn} onClick={fetchPatients}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div style={s.statsStrip}>
        <StatItem
          icon={<Users size={18} style={{ color: "#3db5e6" }} />}
          label="Total Patients"
          value={totalPatients}
          bg="#e0f2fe"
        />
        <StatItem
          icon={<Clock size={18} style={{ color: "#f59e0b" }} />}
          label="Walk-ins"
          value={walkInCount}
          bg="#fef3c7"
        />
        <StatItem
          icon={<FileText size={18} style={{ color: "#8b5cf6" }} />}
          label="With Cases"
          value={withCases}
          bg="#ede9fe"
        />
        <StatItem
          icon={<Activity size={18} style={{ color: "#059669" }} />}
          label="Showing"
          value={displayed.length}
          bg="#d1fae5"
        />
      </div>

      {/* ── Controls: filters + search + refresh ── */}
      <div style={s.controlsRow}>
        <div style={s.filterTabs}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              style={{
                ...s.filterTab,
                ...(filter === f.key ? s.filterTabActive : {}),
              }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={s.searchWrap}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
            }}
          />
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by name, phone, or patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button style={s.refreshBtn} onClick={fetchPatients} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Patient table ── */}
      {displayed.length === 0 ? (
        <EmptyState
          hasSearch={!!searchQuery.trim()}
          onRegister={() => navigate("/clinician/create-case")}
        />
      ) : (
        <div style={s.tableCard}>
          {/* min-width wrapper prevents column collapse on narrow screens */}
          <div style={{ minWidth: 960 }}>
            {/* Column headings */}
            <div style={s.tableHead}>
              <span style={{ flex: "0 0 44px" }} />
              <span style={{ flex: "0 0 180px" }}>Patient</span>
              <span style={{ flex: "0 0 160px" }}>Contact</span>
              <span style={{ flex: "0 0 110px" }}>Sex / Age</span>
              <span style={{ flex: "0 0 130px" }}>Registered</span>
              <span style={{ flex: "0 0 100px", textAlign: "center" as const }}>
                Cases
              </span>
              <span style={{ flex: "0 0 90px", textAlign: "center" as const }}>
                Type
              </span>
              <span style={{ flex: 1 }} />
            </div>

            {/* Patient rows */}
            {displayed.map((patient, idx) => {
              const ac = avatarColor(patient.patient_id);
              const age = calcAge(patient.date_of_birth);

              return (
                <div
                  key={patient.patient_id}
                  style={{
                    ...s.tableRow,
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafbfc",
                  }}
                  onClick={() =>
                    navigate(`/clinician/patients/${patient.patient_id}`)
                  }
                >
                  {/* Avatar */}
                  <div style={{ flex: "0 0 44px" }}>
                    <div
                      style={{
                        ...s.avatar,
                        backgroundColor: ac.bg,
                        color: ac.color,
                      }}
                    >
                      {getInitials(patient.full_name)}
                    </div>
                  </div>

                  {/* Name + formatted patient ID */}
                  <div style={{ flex: "0 0 180px", minWidth: 0 }}>
                    <div style={s.patientName}>{patient.full_name}</div>
                    <div style={s.patientId}>
                      PID-{String(patient.patient_id).padStart(6, "0")}
                    </div>
                  </div>

                  {/* Contact + occupation */}
                  <div style={{ flex: "0 0 160px", minWidth: 0 }}>
                    <div style={s.cellMain}>
                      <Phone
                        size={12}
                        style={{ color: "#94a3b8", flexShrink: 0 }}
                      />
                      <span style={s.cellClip}>
                        {patient.contact_info || "—"}
                      </span>
                    </div>
                    {patient.occupation && (
                      <div style={s.cellSub}>{patient.occupation}</div>
                    )}
                  </div>

                  {/* Sex / Age */}
                  <div style={{ flex: "0 0 110px" }}>
                    <div style={s.cellMain}>
                      {patient.sex
                        ? patient.sex.charAt(0).toUpperCase() +
                          patient.sex.slice(1)
                        : "—"}
                    </div>
                    <div style={s.cellSub}>
                      {age !== null ? `${age} yrs` : "DOB unknown"}
                    </div>
                  </div>

                  {/* Registered date */}
                  <div style={{ flex: "0 0 130px" }}>
                    <div style={s.cellMain}>
                      <Calendar size={12} style={{ color: "#94a3b8" }} />
                      {formatDate(patient.created_at)}
                    </div>
                  </div>

                  {/* Case count badge */}
                  <div
                    style={{ flex: "0 0 100px", textAlign: "center" as const }}
                  >
                    <span
                      style={{
                        ...s.caseBadge,
                        backgroundColor:
                          patient.case_count > 0 ? "#ede9fe" : "#f1f5f9",
                        color: patient.case_count > 0 ? "#5b21b6" : "#94a3b8",
                      }}
                    >
                      <FileText size={11} />
                      {patient.case_count}{" "}
                      {patient.case_count === 1 ? "case" : "cases"}
                    </span>
                  </div>

                  {/* Walk-in vs appointment badge */}
                  <div
                    style={{ flex: "0 0 90px", textAlign: "center" as const }}
                  >
                    {patient.is_walkin ? (
                      <span style={s.walkinBadge}>Walk-in</span>
                    ) : (
                      <span style={s.appointmentBadge}>Appt.</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={s.rowActions}>
                    <button
                      style={s.rowBtnProfile}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clinician/patients/${patient.patient_id}`);
                      }}
                    >
                      <User size={12} />
                      Profile
                    </button>
                    <button
                      style={s.rowBtnCase}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/clinician/create-case?patient_id=${patient.patient_id}`
                        );
                      }}
                    >
                      <Plus size={12} />
                      New Case
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer count ── */}
      {displayed.length > 0 && (
        <p style={s.footerCount}>
          Showing {displayed.length} of {totalPatients} patient
          {totalPatients !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// ─── Stat strip item ──────────────────────────────────────────────────────────
function StatItem({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div style={{ ...s.statItem, backgroundColor: bg }}>
      {icon}
      <div>
        <div style={s.statValue}>{value}</div>
        <div style={s.statLabel}>{label}</div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  hasSearch,
  onRegister,
}: {
  hasSearch: boolean;
  onRegister: () => void;
}) {
  return (
    <div style={s.emptyState}>
      <User size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
      <h3 style={s.emptyTitle}>
        {hasSearch ? "No patients match your search" : "No patients yet"}
      </h3>
      <p style={s.emptySub}>
        {hasSearch
          ? "Try a different name, phone number, or patient ID."
          : "Register your first patient to get started."}
      </p>
      {!hasSearch && (
        <button style={s.emptyBtn} onClick={onRegister}>
          <Plus size={15} />
          Register First Patient
        </button>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "2rem 1.5rem",
    maxWidth: "1200px",
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

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.75rem",
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
  pageSubtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    margin: "0.25rem 0 0 0",
  },
  newPatientBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
  },

  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.875rem 1.25rem",
    borderRadius: "12px",
    borderLeft: "4px solid #ef4444",
    marginBottom: "1.25rem",
    fontSize: "0.875rem",
  },
  retryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    background: "none",
    border: "1px solid #dc2626",
    color: "#dc2626",
    padding: "0.3rem 0.75rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
  },

  statsStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    padding: "1rem 1.25rem",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  statValue: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "0.15rem",
    fontWeight: 500,
  },

  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    marginBottom: "1.25rem",
    flexWrap: "wrap",
  },
  filterTabs: { display: "flex", gap: "0.4rem" },
  filterTab: {
    padding: "0.55rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#64748b",
    fontSize: "0.82rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  filterTabActive: {
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    borderColor: "#3db5e6",
  },
  searchWrap: { position: "relative", flex: 1, minWidth: 220 },
  searchInput: {
    width: "100%",
    padding: "0.6rem 0.875rem 0.6rem 2.4rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.875rem",
    color: "#374151",
    outline: "none",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.6rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#64748b",
    cursor: "pointer",
  },

  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflowX: "auto",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  tableHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1.5rem",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.12s",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  patientName: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  patientId: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    marginTop: "0.1rem",
    fontWeight: 500,
  },
  cellMain: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.85rem",
    color: "#374151",
    fontWeight: 500,
  },
  cellSub: { fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.15rem" },
  cellClip: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  caseBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
  },
  walkinBadge: {
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  appointmentBadge: {
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
  },

  rowActions: {
    flex: 1,
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
  },
  rowBtnProfile: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.4rem 0.75rem",
    borderRadius: "8px",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  rowBtnCase: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.4rem 0.75rem",
    borderRadius: "8px",
    backgroundColor: "#ede9fe",
    color: "#5b21b6",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "4rem 2rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: 700,
    color: "#374151",
    fontSize: "1.1rem",
    margin: "0 0 0.5rem 0",
  },
  emptySub: { fontSize: "0.875rem", color: "#9ca3af", margin: "0 0 1.5rem 0" },
  emptyBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
  },

  footerCount: {
    textAlign: "center",
    fontSize: "0.78rem",
    color: "#94a3b8",
    marginTop: "1rem",
  },
};
