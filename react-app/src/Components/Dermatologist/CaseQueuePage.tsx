// src/Components/Dermatologist/CaseQueuePage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Brain,
  Clock,
  ImageIcon,
  User,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Pill,
  ClipboardList,
  ArrowRight,
  Activity,
  Heart,
  Thermometer,
  RotateCcw,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}`;
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vitals {
  bp?: string;
  temp?: string;
  weight?: string;
  height?: string;
  pulse?: string;
}

interface DermCase {
  case_id: number; // ← primary key — must never be undefined
  patient_id: number;
  patient_name: string;
  patient_dob: string | null;
  patient_sex: string | null;
  patient_occupation: string | null;
  patient_contact: string | null;
  chief_complaint: string;
  symptoms: string | null;
  lesion_location: string | null;
  lesion_type: string | null;
  lesion_duration: string | null;
  prior_treatment: string | null;
  vitals_json: Vitals | null;
  image_count: number;
  status: string;
  created_at: string;
  clinician_name: string;
  predicted_label: string | null;
  confidence_score: number | null;
  prior_case_count: number;
  parent_case_id: number | null;
  parent_complaint: string | null;
  allergy_count: number;
}

type StatusFilter = "sent_to_derm" | "treatment_ready" | "completed";
const VALID_TABS: StatusFilter[] = [
  "sent_to_derm",
  "treatment_ready",
  "completed",
];

const STATUS_TABS: {
  key: StatusFilter;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    key: "sent_to_derm",
    label: "Pending Review",
    color: "#ef4444",
    bg: "#fef2f2",
  },
  {
    key: "treatment_ready",
    label: "Treatment Ready",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  { key: "completed", label: "Completed", color: "#059669", bg: "#f0fdf4" },
];

// CTA config — maps case status to the correct workspace step
// CTA config — maps case status to the correct workspace step
const CTA: Record<
  string,
  {
    label: string;
    sublabel: string;
    step: number;
    gradient: string;
    icon: React.ElementType;
  }
> = {
  // New referral — derm reviews the case, runs AI, submits diagnosis + treatment
  sent_to_derm: {
    label: "Review Case",
    sublabel: "Step 1 — Review, AI + diagnose",
    step: 1,
    gradient: "linear-gradient(135deg,#3db5e6,#1e88d4)",
    icon: Eye,
  },

  // Derm has submitted diagnosis + treatment — ball is in clinician's court.
  // Opens at Step 3 so derm can see what they submitted (read-only context).
  treatment_ready: {
    label: "View Submitted Work",
    sublabel: "Awaiting clinician review ",
    step: 3,
    gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    icon: FileText,
  },

  // Clinician has fully closed the case — purely read-only archive
  completed: {
    label: "View Summary",
    sublabel: "Read-only — case closed by clinician",
    step: 1,
    gradient: "linear-gradient(135deg,#059669,#047857)",
    icon: CheckCircle,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CaseQueuePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read ?tab= from URL on mount so back-navigation restores the correct tab
  const tabFromUrl = searchParams.get("tab") as StatusFilter;
  const [statusTab, setStatusTab] = useState<StatusFilter>(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "sent_to_derm"
  );

  const [cases, setCases] = useState<DermCase[]>([]);
  const [filtered, setFiltered] = useState<DermCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // ── Fetch cases from API ──────────────────────────────────────────────────
  const fetchCases = useCallback(
    async (status: StatusFilter, silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");

      try {
        const res = await fetch(
          `${API}/dermatologists/cases?status=${status}`,
          { headers: auth() }
        );

        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // ── Defensive mapping ─────────────────────────────────────────────────
        // MySQL may return field names slightly different depending on aliasing.
        // We normalise every field here so the rest of the component is safe.
        const rawCases = data.cases || data.data || [];

        const mapped: DermCase[] = rawCases.map((c: any) => ({
          // Accept both `case_id` and `id` in case the query aliases it
          case_id: c.case_id ?? c.id ?? null,
          patient_id: c.patient_id ?? null,
          patient_name: c.patient_name ?? "Unknown Patient",
          patient_dob: c.patient_dob ?? null,
          patient_sex: c.patient_sex ?? null,
          patient_occupation: c.patient_occupation ?? null,
          patient_contact: c.patient_contact ?? null,
          chief_complaint: c.chief_complaint ?? "—",
          symptoms: c.symptoms ?? null,
          lesion_location: c.lesion_location ?? null,
          lesion_type: c.lesion_type ?? null,
          lesion_duration: c.lesion_duration ?? null,
          prior_treatment: c.prior_treatment ?? null,
          vitals_json: c.vitals_json ?? null,
          image_count: c.image_count ?? 0,
          status: c.status ?? status,
          created_at: c.created_at ?? new Date().toISOString(),
          clinician_name: c.clinician_name ?? "—",
          predicted_label: c.predicted_label ?? null,
          confidence_score: c.confidence_score ?? null,
          prior_case_count: c.prior_case_count ?? 0,
          parent_case_id: c.parent_case_id ?? null,
          parent_complaint: c.parent_complaint ?? null,
          allergy_count: c.allergy_count ?? 0,
        }));

        // ── Safety filter: drop any row that has no case_id ──────────────────
        // This prevents /cases/undefined navigations
        const valid = mapped.filter((c) => {
          if (!c.case_id) {
            console.warn("CaseQueuePage: dropped row with missing case_id:", c);
            return false;
          }
          return true;
        });

        setCases(valid);
        setFiltered(valid);
      } catch {
        setError("Failed to load cases. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  // Re-fetch whenever the selected tab changes
  useEffect(() => {
    fetchCases(statusTab);
    setSearch("");
  }, [statusTab, fetchCases]);

  // ── Client-side search filter ─────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(cases);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      cases.filter(
        (c) =>
          c.patient_name.toLowerCase().includes(q) ||
          c.chief_complaint?.toLowerCase().includes(q) ||
          c.lesion_location?.toLowerCase().includes(q) ||
          String(c.case_id).includes(q)
      )
    );
  }, [search, cases]);

  // ── Navigate to correct workspace step ───────────────────────────────────
  const openCase = (c: DermCase) => {
    // Guard: never navigate if case_id is falsy — avoids /cases/undefined
    if (!c.case_id) {
      console.error(
        "CaseQueuePage.openCase: case_id is missing on case object:",
        c
      );
      return;
    }
    localStorage.setItem("derm_current_case_id", String(c.case_id));
    localStorage.setItem("derm_current_case_name", c.patient_name);
    const step = CTA[c.status]?.step ?? 1;
    navigate(`/dermatologist/cases/${c.case_id}?step=${step}`);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };
  // Calculate age from date of birth, return null if dob is missing or invalid
  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
  };

  // vitals_json comes from MySQL as a string — parse it safely
  const parseVitals = (raw: Vitals | string | null): Vitals | null => {
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw;
  };

  const currentTab = STATUS_TABS.find((t) => t.key === statusTab)!;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div style={s.loadWrap}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        <div style={s.loadHeader}>
          <div style={sk("180px", "28px", "8px")} />
          <div style={sk("90px", "36px", "10px")} />
        </div>
        <div style={s.skeletonTabs}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={sk("130px", "40px", "8px")} />
          ))}
        </div>
        <div style={s.caseGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                ...s.caseCard,
                height: "320px",
                animation: "pulse 1.5s ease-in-out infinite",
                backgroundColor: "#f8fafc",
                cursor: "default",
              }}
            />
          ))}
        </div>
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Case Queue</h1>
          <p style={s.pageSubtitle}>
            {statusTab === "sent_to_derm" &&
              "Referrals from clinicians awaiting your review, AI analysis and diagnosis"}
            {statusTab === "treatment_ready" &&
              "Cases you have fully completed — awaiting clinician review"}
            {statusTab === "completed" &&
              "Cases closed by the clinician — read-only archive"}
          </p>
        </div>
        <button
          style={s.refreshBtn}
          onClick={() => fetchCases(statusTab, true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Status tabs ─────────────────────────────────────────────────── */}
      <div style={s.tabsRow}>
        {STATUS_TABS.map((tab) => {
          const isActive = statusTab === tab.key;
          return (
            <button
              key={tab.key}
              style={{
                ...s.tab,
                ...(isActive
                  ? {
                      color: tab.color,
                      borderBottomColor: tab.color,
                      backgroundColor: tab.bg,
                    }
                  : {}),
              }}
              onClick={() => setStatusTab(tab.key)}
            >
              <span
                style={{
                  ...s.tabDot,
                  backgroundColor: isActive ? tab.color : "#d1d5db",
                }}
              />
              {tab.label}
              {isActive && cases.length > 0 && (
                <span
                  style={{
                    ...s.tabBadge,
                    backgroundColor: tab.color + "22",
                    color: tab.color,
                  }}
                >
                  {cases.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div style={s.searchRow}>
        <div style={s.searchWrap}>
          <Search size={15} style={s.searchIcon} />
          <input
            style={s.searchInput}
            placeholder="Search by patient name, complaint, location or case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.searchClear} onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
        <div style={s.resultCount}>
          <Filter size={12} />
          {filtered.length} case{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div style={s.errorBanner}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button style={s.dismissBtn} onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!error && filtered.length === 0 && (
        <div style={s.emptyState}>
          {statusTab === "sent_to_derm" ? (
            <>
              <div style={s.emptyIcon}>
                <CheckCircle size={32} color="#059669" />
              </div>
              <h3 style={s.emptyTitle}>All clear — no pending cases</h3>
              <p style={s.emptySub}>
                New referrals from clinicians will appear here automatically.
              </p>
            </>
          ) : statusTab === "treatment_ready" ? (
            <>
              <div style={s.emptyIcon}>
                <ClipboardList size={32} color="#f59e0b" />
              </div>
              <h3 style={s.emptyTitle}>No cases awaiting treatment</h3>
              <p style={s.emptySub}>
                Cases you have diagnosed will appear here.
              </p>
            </>
          ) : (
            <>
              <div style={s.emptyIcon}>
                <FileText size={32} color="#94a3b8" />
              </div>
              <h3 style={s.emptyTitle}>
                {search
                  ? `No results for "${search}"`
                  : "No completed cases yet"}
              </h3>
              <p style={s.emptySub}>
                {search
                  ? "Try a different search term."
                  : "Completed cases will be archived here."}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Case grid ───────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div style={{ ...s.caseGrid, animation: "fadeIn 0.25s ease" }}>
          {filtered.map((c) => {
            const age = calcAge(c.patient_dob);
            const cta = CTA[c.status] ?? CTA.sent_to_derm;
            const CtaIcon = cta.icon;
            const tab =
              STATUS_TABS.find((t) => t.key === c.status) ?? currentTab;
            const vitals = parseVitals(c.vitals_json);
            const isFollowUp = !!c.parent_case_id;

            return (
              <div
                key={c.case_id} // ← safe because we filtered out null case_ids above
                style={s.caseCard}
                onClick={() => openCase(c)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3db5e6";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(61,181,230,0.15)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* ── Top row: case ID + status badge + follow-up + time ── */}
                <div style={s.cardTop}>
                  <div style={s.caseIdRow}>
                    <span style={s.caseId}>#{c.case_id}</span>
                    <span
                      style={{
                        ...s.statusPill,
                        backgroundColor: tab.color + "18",
                        color: tab.color,
                      }}
                    >
                      {tab.label}
                    </span>
                    {/* Purple follow-up badge — only if linked to a parent case */}
                    {isFollowUp && (
                      <span style={s.followUpBadge}>
                        <RotateCcw size={9} /> Follow-up
                      </span>
                    )}
                  </div>
                  <div style={s.caseTime}>
                    <Clock size={11} /> {timeAgo(c.created_at)}
                  </div>
                </div>

                {/* ── Patient banner ───────────────────────────────────── */}
                <div style={s.patientBanner}>
                  {/* Initials avatar */}
                  <div style={s.avatar}>
                    {c.patient_name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.patientName}>{c.patient_name}</div>
                    <div style={s.patientMeta}>
                      {age ? `${age} yrs` : "—"}
                      {c.patient_sex
                        ? ` · ${
                            c.patient_sex.charAt(0).toUpperCase() +
                            c.patient_sex.slice(1)
                          }`
                        : ""}
                      {c.patient_occupation ? ` · ${c.patient_occupation}` : ""}
                    </div>
                  </div>
                  {/* Blue "prior cases" badge — shows if patient has been seen before */}
                  {c.prior_case_count > 0 && (
                    <div style={s.priorCasesBadge}>
                      <Activity size={10} />
                      {c.prior_case_count} prior case
                      {c.prior_case_count !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* ── Follow-up context box ─────────────────────────────── */}
                {/* Only rendered if this case is a follow-up with a known parent complaint */}
                {isFollowUp && c.parent_complaint && (
                  <div style={s.followUpBox}>
                    <RotateCcw size={11} color="#7c3aed" />
                    <span style={s.followUpText}>
                      Follow-up of Case #{c.parent_case_id}:{" "}
                      <em>{c.parent_complaint}</em>
                    </span>
                  </div>
                )}

                {/* ── Clinical detail rows ─────────────────────────────── */}
                <div style={s.detailRows}>
                  <div style={s.detailRow}>
                    <Stethoscope size={12} color="#94a3b8" />
                    <span style={s.detailLabel}>Complaint</span>
                    <span style={s.detailValue}>
                      {c.chief_complaint || "—"}
                    </span>
                  </div>
                  {c.symptoms && (
                    <div style={s.detailRow}>
                      <FileText size={12} color="#94a3b8" />
                      <span style={s.detailLabel}>Symptoms</span>
                      <span style={{ ...s.detailValue, color: "#64748b" }}>
                        {c.symptoms}
                      </span>
                    </div>
                  )}
                  <div style={s.detailRow}>
                    <User size={12} color="#94a3b8" />
                    <span style={s.detailLabel}>Location</span>
                    <span style={s.detailValue}>
                      {c.lesion_location || "—"}
                    </span>
                  </div>
                  {c.lesion_duration && (
                    <div style={s.detailRow}>
                      <Clock size={12} color="#94a3b8" />
                      <span style={s.detailLabel}>Duration</span>
                      <span style={s.detailValue}>{c.lesion_duration}</span>
                    </div>
                  )}
                  <div style={s.detailRow}>
                    <ImageIcon size={12} color="#94a3b8" />
                    <span style={s.detailLabel}>Images</span>
                    {/* Red text when no images — reminds derm that AI cannot run */}
                    <span
                      style={{
                        ...s.detailValue,
                        color: c.image_count > 0 ? "#059669" : "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {c.image_count > 0
                        ? `${c.image_count} image${
                            c.image_count !== 1 ? "s" : ""
                          } attached`
                        : "No images — AI cannot run"}
                    </span>
                  </div>
                  <div style={s.detailRow}>
                    <Stethoscope size={12} color="#94a3b8" />
                    <span style={s.detailLabel}>Referred by</span>
                    <span style={s.detailValue}>{c.clinician_name}</span>
                  </div>
                </div>

                {/* ── Vitals strip — only if clinician recorded vitals ─────── */}
                {vitals && Object.values(vitals).some(Boolean) && (
                  <div style={s.vitalsStrip}>
                    <div style={s.vitalsTitle}>
                      <Heart size={11} color="#ef4444" /> Vitals
                    </div>
                    <div style={s.vitalsRow}>
                      {vitals.bp && (
                        <span style={s.vitalChip}>
                          <strong>BP</strong> {vitals.bp}
                        </span>
                      )}
                      {vitals.temp && (
                        <span style={s.vitalChip}>
                          <Thermometer size={10} /> {vitals.temp}°C
                        </span>
                      )}
                      {vitals.pulse && (
                        <span style={s.vitalChip}>
                          <Activity size={10} /> {vitals.pulse} bpm
                        </span>
                      )}
                      {vitals.weight && (
                        <span style={s.vitalChip}>
                          <strong>Wt</strong> {vitals.weight} kg
                        </span>
                      )}
                      {vitals.height && (
                        <span style={s.vitalChip}>
                          <strong>Ht</strong> {vitals.height} cm
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Allergy warning — amber if patient has known allergies ── */}
                {c.allergy_count > 0 && (
                  <div style={s.allergyWarning}>
                    <AlertTriangle size={12} color="#d97706" />
                    <span style={s.allergyText}>
                      {c.allergy_count} known allerg
                      {c.allergy_count !== 1 ? "ies" : "y"} — check before
                      prescribing
                    </span>
                  </div>
                )}

                <div style={s.divider} />

                {/* ── CTA button — navigates to the correct workspace step ── */}
                <button
                  style={{ ...s.ctaBtn, background: cta.gradient }}
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card onClick from also firing
                    openCase(c);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <CtaIcon size={14} />
                  <span style={{ flex: 1, textAlign: "left" }}>
                    {cta.label}
                  </span>
                  <span style={s.ctaSublabel}>{cta.sublabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton helper ──────────────────────────────────────────────────────────
const sk = (w: string, h: string, r: string): React.CSSProperties => ({
  width: w,
  height: h,
  borderRadius: r,
  backgroundColor: "#f1f5f9",
  animation: "pulse 1.5s ease-in-out infinite",
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "1200px", margin: "0 auto" },
  loadWrap: { maxWidth: "1200px", margin: "0 auto" },
  loadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  skeletonTabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem" },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  pageTitle: {
    fontSize: "clamp(1.4rem,3vw,1.875rem)",
    fontWeight: 800,
    margin: "0 0 0.3rem",
    background: "linear-gradient(135deg,#1e293b 0%,#3db5e6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  pageSubtitle: { fontSize: "0.875rem", color: "#64748b", margin: 0 },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.55rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#fff",
    color: "#64748b",
    fontSize: "0.825rem",
    fontWeight: 600,
    cursor: "pointer",
  },

  tabsRow: {
    display: "flex",
    borderBottom: "2px solid #f1f5f9",
    marginBottom: "1.25rem",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    borderStyle: "none",
    borderBottomStyle: "solid" as const,
    borderBottomWidth: "2px",
    borderBottomColor: "transparent",
    backgroundColor: "transparent", // only the active tab gets a colored background
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "-2px",
    transition: "all 0.15s",
    borderRadius: "8px 8px 0 0",
  },
  tabDot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  tabBadge: {
    padding: "0.1rem 0.5rem",
    borderRadius: "10px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  searchWrap: { position: "relative" as const, flex: 1 },
  searchIcon: {
    position: "absolute" as const,
    left: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    pointerEvents: "none" as const,
  },
  searchInput: {
    width: "100%",
    padding: "0.7rem 2.25rem 0.7rem 2.5rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "#f8fafc",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  searchClear: {
    position: "absolute" as const,
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "0.2rem",
  },
  resultCount: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.8rem",
    color: "#94a3b8",
    fontWeight: 600,
    flexShrink: 0,
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
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 700,
    marginLeft: "auto",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 1rem",
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.25rem",
    border: "1px solid #e5e7eb",
  },
  emptyTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#374151",
    margin: "0 0 0.5rem",
  },
  emptySub: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: 0,
    maxWidth: "320px",
  },

  caseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))",
    gap: "1.25rem",
  },
  caseCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  caseIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    flexWrap: "wrap" as const,
  },
  caseId: {
    fontSize: "0.75rem",
    fontFamily: "monospace",
    fontWeight: 800,
    color: "#3db5e6",
  },
  statusPill: {
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "0.2rem 0.55rem",
    borderRadius: "10px",
  },
  caseTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.72rem",
    color: "#94a3b8",
  },

  followUpBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.62rem",
    fontWeight: 700,
    color: "#7c3aed",
    backgroundColor: "#faf5ff",
    border: "1px solid #e9d5ff",
    borderRadius: "10px",
    padding: "0.15rem 0.45rem",
  },

  patientBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.875rem",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #f1f5f9",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    flexShrink: 0,
    background: "linear-gradient(135deg,#3db5e6,#1e40af)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  patientName: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#111827",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  patientMeta: { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem" },
  priorCasesBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#3db5e6",
    backgroundColor: "#e0f2fe",
    borderRadius: "8px",
    padding: "0.2rem 0.5rem",
    flexShrink: 0,
  },

  followUpBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.4rem",
    backgroundColor: "#faf5ff",
    border: "1px solid #e9d5ff",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    marginBottom: "0.875rem",
  },
  followUpText: { fontSize: "0.75rem", color: "#6d28d9", lineHeight: 1.4 },

  detailRows: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
    marginBottom: "0.875rem",
  },
  detailRow: { display: "flex", alignItems: "flex-start", gap: "0.5rem" },
  detailLabel: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    width: "68px",
    flexShrink: 0,
    paddingTop: "0.05rem",
  },
  detailValue: {
    fontSize: "0.825rem",
    color: "#374151",
    fontWeight: 500,
    flex: 1,
    lineHeight: 1.4,
  },

  vitalsStrip: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "0.6rem 0.75rem",
    marginBottom: "0.75rem",
  },
  vitalsTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#ef4444",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
  },
  vitalsRow: { display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" },
  vitalChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.75rem",
    color: "#374151",
    backgroundColor: "#fff",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "0.2rem 0.5rem",
    fontWeight: 500,
  },

  allergyWarning: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    marginBottom: "0.75rem",
  },
  allergyText: { fontSize: "0.75rem", color: "#92400e", fontWeight: 600 },

  divider: {
    height: "1px",
    backgroundColor: "#f1f5f9",
    marginBottom: "0.875rem",
  },
  ctaBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.7rem 0.875rem",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.825rem",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  ctaSublabel: {
    fontSize: "0.68rem",
    color: "rgba(255,255,255,0.75)",
    fontWeight: 400,
  },
};
