// src/Components/Dermatologist/DermatologistDashboardPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  FileText,
  Brain,
  Eye,
  TrendingUp,
  AlertTriangle,
  Activity,
  ChevronRight,
  Stethoscope,
  ImageIcon,
  User,
  Calendar,
  RefreshCw,
  Pill,
} from "lucide-react";

const API = "import.meta.env.VITE_API_URL";
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  pendingReview: number;
  reviewedToday: number;
  totalThisWeek: number;
  completedCases: number;
  treatmentReady: number; // ← new: cases diagnosed but needing treatment
}
interface PendingCase {
  case_id: number;
  patient_name: string;
  chief_complaint: string;
  lesion_location: string | null;
  image_count: number;
  created_at: string;
  clinician_name: string;
  predicted_label: string | null;
  confidence_score: number | null;
}
interface RecentActivity {
  case_id: number;
  patient_name: string;
  action: string;
  created_at: string;
  type: string; // "completed" | "diagnosed" | "reviewed"
}
interface DermUser {
  fullName: string; // from DB: full_name or first_name + last_name
  firstName: string; // used in greeting
  specialization: string;
  email: string;
}

// ─── Skeleton block ───────────────────────────────────────────────────────────
const Sk = ({
  w = "100%",
  h = "1rem",
  r = "6px",
}: {
  w?: string;
  h?: string;
  r?: string;
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      backgroundColor: "#f1f5f9",
      animation: "pulse 1.5s ease-in-out infinite",
    }}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function DermatologistDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<DermUser | null>(null);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [pending, setPending] = useState<PendingCase[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "urgent">("all");

  // ── Fetch all dashboard data from API ─────────────────────────────────────
  // /dermatologists/me       → logged-in derm profile
  // /dermatologists/dashboard → stats + pending cases + recent activity
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, dashRes] = await Promise.all([
        fetch(`${API}/dermatologists/me`, { headers: auth() }),
        fetch(`${API}/dermatologists/dashboard`, { headers: auth() }),
      ]);

      if (meRes.status === 401 || dashRes.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!meRes.ok || !dashRes.ok)
        throw new Error("Server error — please try again.");

      const [meData, dashData] = await Promise.all([
        meRes.json(),
        dashRes.json(),
      ]);

      // ── Map /me response → DermUser ──────────────────────────────────────
      // Handles both { fullName } and { first_name, last_name } DB shapes
      const fullName =
        meData.fullName ||
        (meData.first_name && meData.last_name
          ? `${meData.first_name} ${meData.last_name}`
          : meData.first_name || "Doctor");

      setUser({
        fullName,
        firstName: meData.first_name || fullName.split(" ")[0],
        specialization: meData.specialization || meData.role || "Dermatologist",
        email: meData.email || "",
      });

      // ── Map /dashboard response → stats, pending, activity ───────────────
      setStats({
        pendingReview:
          dashData.stats?.pendingReview ?? dashData.stats?.pending_review ?? 0,
        reviewedToday:
          dashData.stats?.reviewedToday ?? dashData.stats?.reviewed_today ?? 0,
        totalThisWeek:
          dashData.stats?.totalThisWeek ?? dashData.stats?.total_this_week ?? 0,
        completedCases:
          dashData.stats?.completedCases ??
          dashData.stats?.completed_cases ??
          0,
        treatmentReady:
          dashData.stats?.treatmentReady ??
          dashData.stats?.treatment_ready ??
          0,
      });

      setPending(
        (dashData.pendingCases || dashData.pending_cases || []).map(
          (c: any) => ({
            case_id: c.case_id,
            patient_name: c.patient_name,
            chief_complaint: c.chief_complaint,
            lesion_location: c.lesion_location ?? null,
            image_count: c.image_count ?? 0,
            created_at: c.created_at,
            clinician_name: c.clinician_name,
            predicted_label: c.predicted_label ?? null,
            confidence_score: c.confidence_score ?? null,
          })
        )
      );

      setActivity(
        (dashData.recentActivity || dashData.recent_activity || []).map(
          (a: any) => ({
            case_id: a.case_id,
            patient_name: a.patient_name,
            action: a.action,
            created_at: a.created_at,
            type: a.type || "reviewed",
          })
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Navigate to correct workspace step based on case status
  const openCase = (
    caseId: number,
    patientName: string,
    status = "sent_to_derm"
  ) => {
    localStorage.setItem("derm_current_case_id", String(caseId));
    localStorage.setItem("derm_current_case_name", patientName);
    const step = status === "treatment_ready" ? 3 : 1;
    navigate(`/dermatologist/cases/${caseId}?step=${step}`);
  };

  const filteredPending =
    filter === "urgent"
      ? pending.filter(
          (c) => !c.predicted_label || (c.confidence_score ?? 0) < 0.7
        )
      : pending;

  // ── Stat cards — all values from API ─────────────────────────────────────
  const STAT_CARDS = [
    {
      label: "Pending Review",
      value: stats?.pendingReview ?? 0,
      icon: Clock,
      color: "#ef4444",
      bg: "#fee2e2",
      note: stats?.pendingReview
        ? `${stats.pendingReview} need${
            stats.pendingReview === 1 ? "s" : ""
          } attention`
        : "All clear ✓",
    },
    {
      label: "Reviewed Today",
      value: stats?.reviewedToday ?? 0,
      icon: CheckCircle,
      color: "#059669",
      bg: "#d1fae5",
      note: "Cases completed today",
    },
    {
      label: "This Week",
      value: stats?.totalThisWeek ?? 0,
      icon: FileText,
      color: "#3db5e6",
      bg: "#e0f2fe",
      note: "Total cases received",
    },
    {
      label: "All Completed",
      value: stats?.completedCases ?? 0,
      icon: TrendingUp,
      color: "#8b5cf6",
      bg: "#ede9fe",
      note: "Lifetime completed",
    },
  ];

  // ── Quick actions — counts come from stats API response ──────────────────
  const QUICK_ACTIONS = [
    {
      label: "View All Cases",
      sublabel: "Open full case queue",
      count: null, // no count — shows all
      path: "/dermatologist/cases",
      icon: FileText,
      color: "#3db5e6",
    },
    {
      label: "Pending Reviews",
      sublabel: "Cases awaiting your review",
      count: stats?.pendingReview ?? null,
      path: "/dermatologist/cases?tab=sent_to_derm",
      icon: Eye,
      color: "#ef4444",
    },
    {
      label: "Add Treatment Plans",
      sublabel: "Diagnosed cases needing Rx",
      count: stats?.treatmentReady ?? null,
      path: "/dermatologist/cases?tab=treatment_ready",
      icon: Pill,
      color: "#f59e0b",
    },
    {
      label: "Completed Cases",
      sublabel: "View archived case history",
      count: stats?.completedCases ?? null,
      path: "/dermatologist/cases?tab=completed",
      icon: CheckCircle,
      color: "#059669",
    },
  ];

  // ── Error state ───────────────────────────────────────────────────────────
  if (!loading && error)
    return (
      <div style={s.errorScreen}>
        <AlertTriangle size={40} color="#ef4444" />
        <p
          style={{
            color: "#1e293b",
            fontWeight: 700,
            fontSize: "1.1rem",
            margin: "0.75rem 0 0.25rem",
          }}
        >
          Failed to load dashboard
        </p>
        <p
          style={{
            color: "#64748b",
            margin: "0 0 1.25rem",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </p>
        <button onClick={fetchDashboard} style={s.retryBtn}>
          <RefreshCw size={15} /> Try Again
        </button>
      </div>
    );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes fadeIn{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Welcome banner — name from API ──────────────────────────────── */}
      <div style={s.welcomeRow}>
        <div>
          {loading ? (
            <>
              <Sk w="220px" h="2rem" r="8px" />
              <div style={{ marginTop: "0.5rem" }}>
                <Sk w="320px" h="1rem" />
              </div>
            </>
          ) : (
            <>
              <h1 style={s.welcomeTitle}>
                {/* firstName from DB — not hardcoded */}
                Welcome back,{" "}
                {user?.firstName ?? user?.fullName?.split(" ")[0] ?? "Doctor"}
              </h1>
              <p style={s.welcomeSub}>
                {user?.specialization && (
                  <span style={{ color: "#3db5e6", fontWeight: 600 }}>
                    {user.specialization} ·{" "}
                  </span>
                )}
                {(stats?.pendingReview ?? 0) > 0
                  ? `${stats!.pendingReview} case${
                      stats!.pendingReview !== 1 ? "s" : ""
                    } awaiting your expert review`
                  : "All cases are up to date — great work!"}
              </p>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={fetchDashboard}
            style={s.refreshBtn}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading ? "spin 0.8s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
          <div style={s.dateBadge}>
            <Calendar size={13} />
            {new Date().toLocaleDateString("en-GH", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* ── Stat cards — all from API ───────────────────────────────────── */}
      <div style={s.statsGrid}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={s.statCard}>
                <div style={s.statTop}>
                  <div style={{ flex: 1 }}>
                    <Sk w="80px" h="0.75rem" />
                    <div style={{ margin: "0.6rem 0 0.4rem" }}>
                      <Sk w="60px" h="2rem" r="8px" />
                    </div>
                    <Sk w="110px" h="0.75rem" />
                  </div>
                  <Sk w="44px" h="44px" r="12px" />
                </div>
              </div>
            ))
          : STAT_CARDS.map((card, i) => (
              <div
                key={i}
                style={s.statCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.04)";
                }}
              >
                <div style={s.statTop}>
                  <div>
                    <div style={s.statLabel}>{card.label}</div>
                    <div style={{ ...s.statValue, color: card.color }}>
                      {card.value}
                    </div>
                    <div style={s.statNote}>{card.note}</div>
                  </div>
                  <div style={{ ...s.statIconBox, backgroundColor: card.bg }}>
                    <card.icon size={22} color={card.color} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* ── Two-column body ─────────────────────────────────────────────── */}
      <div style={s.twoCol}>
        {/* ══ LEFT — Pending cases from API ═══════════════════════════════ */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <div style={{ ...s.cardTitleIcon, backgroundColor: "#fee2e2" }}>
                <AlertTriangle size={15} color="#ef4444" />
              </div>
              <span>Cases Pending Review</span>
              {/* Count from API */}
              {!loading && pending.length > 0 && (
                <span style={s.countBadge}>{pending.length}</span>
              )}
            </div>
            <div style={s.filterRow}>
              {(["all", "urgent"] as const).map((f) => (
                <button
                  key={f}
                  style={{
                    ...s.filterBtn,
                    ...(filter === f ? s.filterBtnActive : {}),
                  }}
                  onClick={() => setFilter(f)}
                >
                  {f === "all"
                    ? "All"
                    : `Urgent${
                        filter === "urgent" && filteredPending.length > 0
                          ? ` (${filteredPending.length})`
                          : ""
                      }`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {[1, 2].map((i) => (
                <div key={i} style={{ ...s.caseCard, cursor: "default" }}>
                  <Sk w="80px" h="0.75rem" />
                  <div style={{ margin: "0.4rem 0 0.75rem" }}>
                    <Sk w="160px" h="1.1rem" />
                  </div>
                  <Sk h="2.5rem" r="8px" />
                  <div style={{ marginTop: "0.75rem" }}>
                    <Sk h="2.5rem" r="10px" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPending.length === 0 ? (
            <div style={s.emptyState}>
              <CheckCircle
                size={36}
                color="#6ee7b7"
                style={{ marginBottom: "0.75rem" }}
              />
              <p style={{ color: "#064e3b", fontWeight: 700, margin: 0 }}>
                {filter === "urgent" ? "No urgent cases" : "No pending cases"}
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.825rem",
                  margin: "0.3rem 0 0",
                }}
              >
                {filter === "urgent"
                  ? "Switch to 'All' to see all pending"
                  : "All cases have been reviewed"}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                animation: "fadeIn 0.2s ease",
              }}
            >
              {filteredPending.map((c) => (
                <div
                  key={c.case_id}
                  style={s.caseCard}
                  onClick={() => openCase(c.case_id, c.patient_name)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3db5e6";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(61,181,230,0.12)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Header */}
                  <div style={s.caseCardHeader}>
                    <div>
                      <div style={s.caseIdBadge}>Case #{c.case_id}</div>
                      {/* patient_name from API */}
                      <div style={s.casePatientName}>{c.patient_name}</div>
                    </div>
                    <div style={s.caseTime}>
                      <Clock size={11} />
                      {timeAgo(c.created_at)}
                    </div>
                  </div>

                  {/* Info grid — all from API */}
                  <div style={s.caseInfoGrid}>
                    {[
                      {
                        icon: Stethoscope,
                        label: "Complaint",
                        value: c.chief_complaint || "—",
                      },
                      {
                        icon: User,
                        label: "Location",
                        value: c.lesion_location || "—",
                      },
                      {
                        icon: ImageIcon,
                        label: "Images",
                        value:
                          c.image_count > 0
                            ? `${c.image_count} image${
                                c.image_count !== 1 ? "s" : ""
                              }`
                            : "No images yet",
                      },
                      {
                        icon: User,
                        label: "Referred by",
                        value: c.clinician_name,
                      },
                    ].map((row) => (
                      <div key={row.label} style={s.caseInfoItem}>
                        <row.icon size={12} color="#94a3b8" />
                        <span style={s.caseInfoLabel}>{row.label}</span>
                        <span style={s.caseInfoValue}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI notice — predicted_label from API, score not shown here */}
                  <div
                    style={{
                      ...s.aiNoticeBox,
                      backgroundColor: c.predicted_label
                        ? "#faf5ff"
                        : "#f8fafc",
                      borderColor: c.predicted_label ? "#e9d5ff" : "#e5e7eb",
                    }}
                  >
                    <Brain
                      size={13}
                      color={c.predicted_label ? "#7c3aed" : "#94a3b8"}
                    />
                    <span
                      style={{
                        ...s.aiNoticeText,
                        color: c.predicted_label ? "#6d28d9" : "#94a3b8",
                      }}
                    >
                      {c.predicted_label
                        ? "AI analysis ready — revealed in workspace"
                        : "AI analysis pending — images required"}
                    </span>
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        backgroundColor: c.predicted_label
                          ? "#7c3aed"
                          : "#d1d5db",
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  {/* CTA */}
                  <button
                    style={s.reviewBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCase(c.case_id, c.patient_name);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.88")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <Eye size={15} />
                    Review Case — Step 1
                    <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                  </button>
                </div>
              ))}

              {/* View all link if more than shown */}
              {pending.length >= 5 && (
                <button
                  style={s.viewAllBtn}
                  onClick={() =>
                    navigate("/dermatologist/cases?tab=sent_to_derm")
                  }
                >
                  View all {stats?.pendingReview} pending cases
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ══ RIGHT — Activity + Quick actions ════════════════════════════ */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>
              <div style={{ ...s.cardTitleIcon, backgroundColor: "#e0f2fe" }}>
                <TrendingUp size={15} color="#3db5e6" />
              </div>
              <span>Recent Activity</span>
              {!loading && activity.length > 0 && (
                <span
                  style={{
                    ...s.countBadge,
                    backgroundColor: "#e0f2fe",
                    color: "#3db5e6",
                  }}
                >
                  {activity.length}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ ...s.activityItem, cursor: "default" }}>
                  <Sk w="8px" h="8px" r="50%" />
                  <div style={{ flex: 1 }}>
                    <Sk w="60px" h="0.7rem" />
                    <div style={{ margin: "0.3rem 0" }}>
                      <Sk w="120px" h="0.875rem" />
                    </div>
                    <Sk w="160px" h="0.775rem" />
                  </div>
                  <Sk w="40px" h="0.7rem" />
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div style={s.emptyState}>
              <Activity
                size={32}
                color="#d1d5db"
                style={{ marginBottom: "0.5rem" }}
              />
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.875rem" }}>
                No recent activity yet
              </p>
              <p
                style={{
                  color: "#cbd5e1",
                  margin: "0.3rem 0 0",
                  fontSize: "0.8rem",
                }}
              >
                Activity appears after you review cases
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {activity.map((a, i) => (
                <div
                  key={i}
                  style={s.activityItem}
                  onClick={() => openCase(a.case_id, a.patient_name, a.type)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f9ff";
                    e.currentTarget.style.borderColor = "#bae6fd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div style={s.activityLeft}>
                    <div
                      style={{
                        ...s.activityDot,
                        backgroundColor:
                          a.type === "completed"
                            ? "#059669"
                            : a.type === "treatment_ready"
                            ? "#f59e0b"
                            : "#3db5e6",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* All from API: case_id, patient_name, action */}
                    <div style={s.activityCaseId}>Case #{a.case_id}</div>
                    <div style={s.activityPatient}>{a.patient_name}</div>
                    <div style={s.activityAction}>{a.action}</div>
                  </div>
                  <div style={s.activityTime}>{timeAgo(a.created_at)}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Quick actions — counts from stats API ────────────────────── */}
          <div style={s.quickNav}>
            <div style={s.quickNavTitle}>Quick Actions</div>
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item.label}
                style={s.quickNavBtn}
                onClick={() => navigate(item.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f9ff";
                  e.currentTarget.style.borderColor = "#bae6fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div
                  style={{
                    ...s.quickNavIconBox,
                    backgroundColor: item.color + "18",
                  }}
                >
                  <item.icon size={13} color={item.color} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    {item.sublabel}
                  </div>
                </div>
                {/* Live count badge from API stats — not static */}
                {!loading && item.count !== null && item.count > 0 && (
                  <span
                    style={{
                      ...s.quickNavCount,
                      backgroundColor: item.color + "18",
                      color: item.color,
                    }}
                  >
                    {item.count}
                  </span>
                )}
                <ChevronRight size={13} color="#d1d5db" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "1200px", margin: "0 auto" },
  errorScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    gap: "0.25rem",
  },
  retryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1.25rem",
    backgroundColor: "#3db5e6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.875rem",
  },

  welcomeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.75rem",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  welcomeTitle: {
    fontSize: "clamp(1.4rem,3vw,1.875rem)",
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 0.3rem",
    background: "linear-gradient(135deg,#1e293b 0%,#3db5e6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  welcomeSub: { fontSize: "0.9rem", color: "#64748b", margin: 0 },
  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    padding: "0.5rem 0.875rem",
    borderRadius: "10px",
    fontSize: "0.8rem",
    fontWeight: 600,
    flexShrink: 0,
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.5rem 0.875rem",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#64748b",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "1.25rem",
    marginBottom: "1.75rem",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.25rem 1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: "all 0.2s",
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: "0.3rem",
  },
  statNote: { fontSize: "0.75rem", color: "#64748b" },
  statIconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#111827",
  },
  cardTitleIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  countBadge: {
    backgroundColor: "#fee2e2",
    color: "#ef4444",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.1rem 0.5rem",
    borderRadius: "10px",
  },
  filterRow: { display: "flex", gap: "0.4rem" },
  filterBtn: {
    padding: "0.35rem 0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "0.775rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  filterBtnActive: {
    backgroundColor: "#3db5e6",
    borderColor: "#3db5e6",
    color: "#fff",
  },

  caseCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1.25rem",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  caseCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.875rem",
  },
  caseIdBadge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#3db5e6",
    fontFamily: "monospace",
    marginBottom: "0.2rem",
  },
  casePatientName: { fontSize: "1rem", fontWeight: 700, color: "#111827" },
  caseTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.72rem",
    color: "#94a3b8",
  },
  caseInfoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
    marginBottom: "0.875rem",
  },
  caseInfoItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.775rem",
  },
  caseInfoLabel: { color: "#94a3b8", fontWeight: 600 },
  caseInfoValue: { color: "#374151", fontWeight: 500 },

  aiNoticeBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0.55rem 0.75rem",
    marginBottom: "0.875rem",
  },
  aiNoticeText: { fontSize: "0.75rem", fontWeight: 500, flex: 1 },

  reviewBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.7rem",
    background: "linear-gradient(135deg,#3db5e6 0%,#1e88d4 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  viewAllBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    width: "100%",
    padding: "0.6rem",
    border: "1px dashed #bae6fd",
    borderRadius: "10px",
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },

  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.875rem",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  activityLeft: { paddingTop: "0.25rem" },
  activityDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  activityCaseId: {
    fontSize: "0.7rem",
    fontFamily: "monospace",
    color: "#3db5e6",
    fontWeight: 700,
  },
  activityPatient: { fontSize: "0.875rem", fontWeight: 600, color: "#111827" },
  activityAction: {
    fontSize: "0.775rem",
    color: "#64748b",
    marginTop: "0.1rem",
  },
  activityTime: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    flexShrink: 0,
    paddingTop: "0.15rem",
  },

  quickNav: {
    marginTop: "1.25rem",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "1.25rem",
  },
  quickNavTitle: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "0.75rem",
  },
  quickNavBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    width: "100%",
    padding: "0.65rem 0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#fff",
    fontSize: "0.825rem",
    cursor: "pointer",
    marginBottom: "0.5rem",
    transition: "all 0.15s",
    textAlign: "left" as const,
  },
  quickNavIconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quickNavCount: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.1rem 0.5rem",
    borderRadius: "10px",
    flexShrink: 0,
  },

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1rem",
    textAlign: "center" as const,
  },
};
