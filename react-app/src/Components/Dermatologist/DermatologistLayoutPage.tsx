// src/Components/Dermatologist/DermatologistLayoutPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Bell,
  ChevronRight,
  Stethoscope,
  ClipboardList,
  Users,
  UserCircle,
  CheckCircle,
  X,
  AlertCircle,
  Info,
  RefreshCw,
  BellOff,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}";
const tok = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${tok()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface DermUser {
  fullName: string;
  specialization: string;
  dermatologistId: number;
}
interface ActiveCase {
  caseId: string;
  patientName: string;
  step: number;
}
interface Notification {
  notification_id: number;
  message: string;
  type: "new_case" | "case_completed" | "system" | string;
  is_read: boolean;
  case_id: number | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
  });
};

const groupByDate = (notifs: Notification[]) => {
  const now = new Date();
  const today = now.toDateString();
  const yest = new Date(now.getTime() - 86400000).toDateString();
  const groups: Record<string, Notification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };
  notifs.forEach((n) => {
    const d = new Date(n.created_at).toDateString();
    const diff = Math.floor(
      (now.getTime() - new Date(n.created_at).getTime()) / 86400000
    );
    if (d === today) groups["Today"].push(n);
    else if (d === yest) groups["Yesterday"].push(n);
    else if (diff < 7) groups["This Week"].push(n);
    else groups["Older"].push(n);
  });
  return groups;
};

const NOTIF_ICON: Record<string, React.ReactNode> = {
  new_case: <ClipboardList size={15} color="#3db5e6" />,
  case_completed: <CheckCircle size={15} color="#059669" />,
  system: <Info size={15} color="#f59e0b" />,
};
const NOTIF_BG: Record<string, string> = {
  new_case: "#e0f2fe",
  case_completed: "#dcfce7",
  system: "#fef9c3",
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function NotificationDrawer({
  open,
  onClose,
  onUnreadChange,
}: {
  open: boolean;
  onClose: () => void;
  onUnreadChange: (n: number) => void;
}) {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "cases" | "system">(
    "all"
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/dermatologists/notifications`, {
        headers: auth(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      onUnreadChange(
        (data.notifications ?? []).filter((n: Notification) => !n.is_read)
          .length
      );
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Close on overlay click
  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const markOne = async (id: number) => {
    try {
      await fetch(`${API}/dermatologists/notifications/${id}/read`, {
        method: "PATCH",
        headers: auth(),
      });
      setNotifs((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n
        )
      );
      onUnreadChange(
        notifs.filter((n) => !n.is_read && n.notification_id !== id).length
      );
    } catch {
      /* silent */
    }
  };

  const markAll = async () => {
    try {
      await fetch(`${API}/dermatologists/notifications/read-all`, {
        method: "PATCH",
        headers: auth(),
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onUnreadChange(0);
    } catch {
      /* silent */
    }
  };

  const handleClick = (n: Notification) => {
    markOne(n.notification_id);
    if (n.case_id) {
      navigate(`/dermatologist/cases/${n.case_id}?step=1`);
      onClose();
    }
  };

  // Filter logic
  const filtered = notifs.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "cases")
      return n.type === "new_case" || n.type === "case_completed";
    if (filter === "system") return n.type === "system";
    return true;
  });

  const grouped = groupByDate(filtered);
  const unread = notifs.filter((n) => !n.is_read).length;

  if (!open) return null;

  return (
    <div ref={overlayRef} style={d.overlay} onClick={handleOverlay}>
      <div style={d.drawer}>
        <style>{`
          @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
          @keyframes spin     { to{transform:rotate(360deg)} }
        `}</style>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={d.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={16} color="#3db5e6" />
            <span style={d.title}>Notifications</span>
            {unread > 0 && <span style={d.unreadPill}>{unread} new</span>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {unread > 0 && (
              <button style={d.markAllBtn} onClick={markAll}>
                Mark all read
              </button>
            )}
            <button style={d.closeBtn} onClick={onClose}>
              <X size={16} color="#64748b" />
            </button>
          </div>
        </div>

        {/* ── Filter tabs ─────────────────────────────────────────────── */}
        <div style={d.tabs}>
          {(
            [
              { key: "all", label: "All" },
              {
                key: "unread",
                label: `Unread${unread > 0 ? ` (${unread})` : ""}`,
              },
              { key: "cases", label: "Cases" },
              { key: "system", label: "System" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              style={{ ...d.tab, ...(filter === key ? d.tabActive : {}) }}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div style={d.body}>
          {loading ? (
            <div style={d.center}>
              <RefreshCw
                size={22}
                color="#3db5e6"
                style={{ animation: "spin 1s linear infinite" }}
              />
              <span style={{ color: "#94a3b8", fontSize: "0.825rem" }}>
                Loading…
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={d.center}>
              <BellOff size={32} color="#cbd5e1" />
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>
                {filter === "unread"
                  ? "You're all caught up!"
                  : "No notifications"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) =>
              items.length === 0 ? null : (
                <div key={group}>
                  <div style={d.groupLabel}>{group}</div>
                  {items.map((n) => (
                    <div
                      key={n.notification_id}
                      style={{
                        ...d.notifRow,
                        backgroundColor: n.is_read ? "transparent" : "#f0f9ff",
                        cursor: n.case_id ? "pointer" : "default",
                      }}
                      onClick={() => handleClick(n)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = n.is_read
                          ? "transparent"
                          : "#f0f9ff")
                      }
                    >
                      {/* Unread dot */}
                      <div style={d.dotWrap}>
                        {!n.is_read && <span style={d.unreadDot} />}
                      </div>

                      {/* Icon */}
                      <div
                        style={{
                          ...d.iconBox,
                          backgroundColor: NOTIF_BG[n.type] ?? "#f1f5f9",
                        }}
                      >
                        {NOTIF_ICON[n.type] ?? (
                          <AlertCircle size={15} color="#94a3b8" />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            ...d.notifMsg,
                            fontWeight: n.is_read ? 400 : 600,
                            color: n.is_read ? "#475569" : "#1e293b",
                          }}
                        >
                          {n.message}
                        </div>
                        <div style={d.notifTime}>
                          {fmtRelative(n.created_at)}
                        </div>
                      </div>

                      {/* Case arrow */}
                      {n.case_id && (
                        <ChevronRight
                          size={13}
                          color="#cbd5e1"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={d.footer}>
          <button style={d.refreshBtn} onClick={load}>
            <RefreshCw size={12} /> Refresh
          </button>
          <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>
            {notifs.length} total notification{notifs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Drawer Styles ────────────────────────────────────────────────────────────
const d: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "flex-end",
  },
  drawer: {
    width: "420px",
    maxWidth: "100vw",
    height: "100vh",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
    animation: "slideIn 0.25s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.1rem 1.25rem",
    borderBottom: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  title: { fontSize: "1rem", fontWeight: 800, color: "#1e293b" },
  unreadPill: {
    fontSize: "0.68rem",
    fontWeight: 700,
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: "0.15rem 0.55rem",
    borderRadius: "10px",
  },
  markAllBtn: {
    fontSize: "0.775rem",
    fontWeight: 600,
    color: "#3db5e6",
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    padding: "0.35rem 0.7rem",
    cursor: "pointer",
  },
  closeBtn: {
    width: "30px",
    height: "30px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    padding: "0 1.25rem",
    borderBottom: "2px solid #f1f5f9",
    flexShrink: 0,
    gap: "0.1rem",
  },
  tab: {
    padding: "0.65rem 0.875rem",
    border: "none",
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    color: "#94a3b8",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "-2px",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  tabActive: { color: "#3db5e6", borderBottomColor: "#3db5e6" },
  body: { flex: 1, overflowY: "auto", padding: "0.5rem 0" },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    height: "200px",
  },
  groupLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "0.75rem 1.25rem 0.35rem",
  },
  notifRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.875rem 1.25rem",
    transition: "background-color 0.12s",
    borderBottom: "1px solid #f8fafc",
  },
  dotWrap: {
    width: "10px",
    flexShrink: 0,
    paddingTop: "0.35rem",
    display: "flex",
    justifyContent: "center",
  },
  unreadDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#3db5e6",
    display: "block",
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "9px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notifMsg: { fontSize: "0.84rem", lineHeight: 1.4 },
  notifTime: { fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.25rem" },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.25rem",
    borderTop: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.775rem",
    fontWeight: 600,
    color: "#64748b",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.35rem 0.75rem",
    cursor: "pointer",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
export default function DermatologistLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<DermUser | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCase, setActiveCase] = useState<ActiveCase | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/dermatologists/me`, {
          headers: auth(),
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        const data = await res.json();
        setUser({
          fullName: data.fullName || "Dr. Dermatologist",
          specialization: data.specialization || "Dermatologist",
          dermatologistId: data.dermatologistId || 0,
        });
      } catch {
        setUser({
          fullName: "Dr. Dermatologist",
          specialization: "Dermatologist",
          dermatologistId: 0,
        });
      }
    })();
  }, [navigate]);

  // ── Fetch counts on every route change ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [countRes, notiRes] = await Promise.all([
          fetch(`${API}/dermatologists/cases/pending/count`, {
            headers: auth(),
          }),
          fetch(`${API}/dermatologists/notifications/unread/count`, {
            headers: auth(),
          }),
        ]);
        const countData = await countRes.json();
        const notiData = await notiRes.json();
        setPendingCount(countData.count ?? 0);
        setUnreadCount(notiData.count ?? 0);
      } catch {
        /* silent */
      }
    })();
  }, [location.pathname]);

  // ── Active case from localStorage ────────────────────────────────────────
  useEffect(() => {
    const caseId = localStorage.getItem("derm_current_case_id");
    const caseName =
      localStorage.getItem("derm_current_case_name") || "Patient";
    const p = location.pathname;
    if (!caseId) {
      setActiveCase(null);
      return;
    }
    const step = p.startsWith(`/dermatologist/cases/${caseId}`)
      ? p.includes("step=2")
        ? 2
        : p.includes("step=3")
        ? 3
        : 1
      : null;
    if (step !== null) {
      setActiveCase({ caseId, patientName: caseName, step });
    } else {
      setActiveCase((prev) =>
        prev?.caseId === caseId
          ? prev
          : { caseId, patientName: caseName, step: 1 }
      );
    }
  }, [location]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");

  const isActive = (base: string) => {
    const p = location.pathname;
    switch (base) {
      case "/dermatologist/dashboard":
        return p === "/dermatologist/dashboard" || p === "/dermatologist";
      case "/dermatologist/cases":
        return p === "/dermatologist/cases";
      case "/dermatologist/workspace":
        return (
          p.startsWith("/dermatologist/cases/") && p !== "/dermatologist/cases"
        );
      case "/dermatologist/patients":
        return p.startsWith("/dermatologist/patients");
      case "/dermatologist/profile":
        return p === "/dermatologist/profile";
      default:
        return p === base;
    }
  };

  const pageTitle = (() => {
    const p = location.pathname;
    if (p === "/dermatologist/dashboard") return "Dashboard";
    if (p === "/dermatologist/cases") return "Case Queue";
    if (p.startsWith("/dermatologist/cases/")) return "Case Workspace";
    if (p.startsWith("/dermatologist/patients")) return "Patient History";
    if (p === "/dermatologist/profile") return "My Profile";
    return "Dermatologist Portal";
  })();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("derm_current_case_id");
      localStorage.removeItem("derm_current_case_name");
      navigate("/login");
    }
  };

  const NAV_SECTIONS = [
    {
      section: "Overview",
      items: [
        {
          base: "/dermatologist/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      section: "Cases",
      items: [
        {
          base: "/dermatologist/cases",
          label: "Case Queue",
          icon: ClipboardList,
          badge: pendingCount > 0 ? String(pendingCount) : null,
        },
      ],
    },
    {
      section: "Patient",
      items: [
        {
          base: "/dermatologist/patients",
          label: "Patient History",
          icon: Users,
          badge: null,
        },
      ],
    },
    {
      section: "Account",
      items: [
        {
          base: "/dermatologist/profile",
          label: "My Profile",
          icon: UserCircle,
          badge: null,
        },
      ],
    },
  ];

  return (
    <div style={s.container}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={s.logo}>
            <span style={{ color: "#3db5e6" }}>Akoma</span>
            <span style={{ color: "#1e293b" }}>Derma</span>
          </div>
          <div style={s.logoSub}>Dermatologist Portal</div>
        </div>

        <nav style={s.nav}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: "0.25rem" }}>
              <div style={s.sectionLabel}>{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.base);
                return (
                  <div
                    key={item.label}
                    onClick={() => navigate(item.base)}
                    style={{
                      ...s.navItem,
                      ...(active ? s.navItemActive : s.navItemInactive),
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                        e.currentTarget.style.color = "#1e293b";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#64748b";
                      }
                    }}
                  >
                    <div
                      style={{
                        ...s.navIcon,
                        ...(active ? s.navIconActive : {}),
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{ ...s.badge, ...(active ? s.badgeActive : {}) }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <ChevronRight size={14} style={{ opacity: 0.7 }} />
                    )}
                  </div>
                );
              })}

              {/* Active case tracker */}
              {section.section === "Cases" && activeCase && (
                <div style={s.workspaceCard}>
                  <div style={s.workspaceHeader}>
                    <div style={s.workspaceDot} />
                    <div style={s.workspaceTitle}>Active Case</div>
                    <button
                      style={s.workspaceClose}
                      onClick={() => {
                        localStorage.removeItem("derm_current_case_id");
                        localStorage.removeItem("derm_current_case_name");
                        setActiveCase(null);
                        navigate("/dermatologist/cases");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={s.workspaceCaseId}>Case #{activeCase.caseId}</div>
                  <div style={s.workspacePatient}>{activeCase.patientName}</div>
                  <div style={s.stepTracker}>
                    {[
                      { num: 1, label: "Review" },
                      { num: 2, label: "Diagnose" },
                      { num: 3, label: "Treatment" },
                    ].map((step, i) => {
                      const done = activeCase.step > step.num;
                      const current = activeCase.step === step.num;
                      return (
                        <React.Fragment key={step.num}>
                          <div
                            style={{
                              ...s.stepItem,
                              ...(current ? s.stepCurrent : {}),
                              ...(done ? s.stepDone : {}),
                            }}
                            onClick={() =>
                              navigate(
                                `/dermatologist/cases/${activeCase.caseId}?step=${step.num}`
                              )
                            }
                          >
                            <div
                              style={{
                                ...s.stepCircle,
                                ...(current ? s.stepCircleCurrent : {}),
                                ...(done ? s.stepCircleDone : {}),
                              }}
                            >
                              {done ? <CheckCircle size={10} /> : step.num}
                            </div>
                            <span style={s.stepLabel}>{step.label}</span>
                          </div>
                          {i < 2 && (
                            <div
                              style={{
                                ...s.stepConnector,
                                ...(done ? s.stepConnectorDone : {}),
                              }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Pending alert */}
        <div
          style={{
            ...s.alertCard,
            backgroundColor: pendingCount > 0 ? "#fef2f2" : "#f0fdf4",
            borderColor: pendingCount > 0 ? "#fecaca" : "#6ee7b7",
          }}
        >
          <div
            style={{
              ...s.alertLabel,
              color: pendingCount > 0 ? "#991b1b" : "#065f46",
            }}
          >
            {pendingCount > 0 ? "⚠ Needs Attention" : "✓ All Clear"}
          </div>
          <div
            style={{
              ...s.alertValue,
              color: pendingCount > 0 ? "#ef4444" : "#059669",
            }}
          >
            {pendingCount}
          </div>
          <div
            style={{
              ...s.alertDesc,
              color: pendingCount > 0 ? "#991b1b" : "#065f46",
            }}
          >
            {pendingCount > 0
              ? `case${pendingCount !== 1 ? "s" : ""} pending review`
              : "No pending cases"}
          </div>
        </div>

        {/* Profile card */}
        <div style={s.profileCard}>
          <div style={s.profileAvatar}>
            {user ? initials(user.fullName) : "DR"}
          </div>
          <div style={s.profileInfo}>
            <div style={s.profileName}>{user?.fullName ?? "Loading..."}</div>
            <div style={s.profileRole}>
              <Stethoscope size={11} style={{ flexShrink: 0 }} />
              {user?.specialization ?? "Dermatologist"}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={s.sidebarFooter}>
          <button
            onClick={handleLogout}
            style={s.logoutBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.color = "#ef4444";
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div style={s.mainArea}>
        {/* Header */}
        <header style={s.header}>
          <div style={s.headerLeft}>
            <h1 style={s.headerTitle}>{pageTitle}</h1>
            <div style={s.headerBreadcrumb}>
              Dermatologist Portal
              <ChevronRight size={13} style={{ margin: "0 0.25rem" }} />
              <span style={{ color: "#3db5e6" }}>{pageTitle}</span>
              {activeCase && pageTitle === "Case Workspace" && (
                <>
                  <ChevronRight size={13} style={{ margin: "0 0.25rem" }} />
                  <span style={{ color: "#64748b" }}>
                    Case #{activeCase.caseId} · {activeCase.patientName}
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={s.headerRight}>
            {/* ── Bell button — opens drawer, NOT a nav link ── */}
            <button
              style={s.bellBtn}
              onClick={() => setDrawerOpen(true)}
              title="Notifications"
            >
              <Bell size={18} color={unreadCount > 0 ? "#3db5e6" : "#64748b"} />
              {unreadCount > 0 && (
                <span style={s.bellBadge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User chip */}
            <div style={s.userChip}>
              <div style={s.userInfo}>
                <div style={s.userName}>{user?.fullName ?? "Loading..."}</div>
                <div style={s.userRole}>
                  {user?.specialization ?? "Dermatologist"}
                </div>
              </div>
              <div
                style={s.avatarCircle}
                onClick={() => navigate("/dermatologist/profile")}
              >
                {user ? initials(user.fullName) : "DR"}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          <Outlet />
        </main>
      </div>

      {/* ── Notification Drawer ─────────────────────────────────────────── */}
      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUnreadChange={setUnreadCount}
      />
    </div>
  );
}

// ─── Layout Styles ────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  },
  sidebar: {
    width: "260px",
    minWidth: "260px",
    backgroundColor: "#fff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
  },
  sidebarHeader: {
    padding: "1.5rem 1.25rem 1.25rem",
    borderBottom: "1px solid #f1f5f9",
  },
  logo: { fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" },
  logoSub: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginTop: "0.2rem",
  },
  nav: { flex: 1, padding: "1rem 0.75rem", overflowY: "auto" },
  sectionLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    padding: "0.6rem 0.75rem 0.35rem",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    padding: "0.68rem 0.875rem",
    marginBottom: "0.1rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.15s",
    color: "#64748b",
  },
  navItemActive: {
    background: "linear-gradient(135deg,#3db5e6 0%,#1e88d4 100%)",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(61,181,230,0.30)",
  },
  navItemInactive: { backgroundColor: "transparent" },
  navIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "7px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navIconActive: { backgroundColor: "rgba(255,255,255,0.20)" },
  badge: {
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: "0.1rem 0.45rem",
    borderRadius: "10px",
    fontSize: "0.68rem",
    fontWeight: 700,
  },
  badgeActive: { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" },
  workspaceCard: {
    margin: "0.5rem 0 0.25rem",
    borderRadius: "12px",
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    padding: "0.875rem 0.875rem 0.75rem",
  },
  workspaceHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginBottom: "0.4rem",
  },
  workspaceDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#3db5e6",
    flexShrink: 0,
    animation: "pulse 2s ease-in-out infinite",
  },
  workspaceTitle: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#0369a1",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    flex: 1,
  },
  workspaceClose: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.75rem",
    padding: "0",
    lineHeight: 1,
  },
  workspaceCaseId: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#3db5e6",
    fontFamily: "monospace",
    marginBottom: "0.1rem",
  },
  workspacePatient: {
    fontSize: "0.825rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "0.6rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  stepTracker: { display: "flex", alignItems: "center" },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.2rem",
    cursor: "pointer",
    opacity: 0.5,
  },
  stepCurrent: { opacity: 1 },
  stepDone: { opacity: 0.9 },
  stepCircle: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#94a3b8",
    transition: "all 0.2s",
  },
  stepCircleCurrent: {
    backgroundColor: "#3db5e6",
    color: "#fff",
    boxShadow: "0 0 0 3px rgba(61,181,230,0.25)",
  },
  stepCircleDone: { backgroundColor: "#10b981", color: "#fff" },
  stepLabel: {
    fontSize: "0.6rem",
    fontWeight: 600,
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  stepConnector: {
    flex: 1,
    height: "2px",
    backgroundColor: "#e2e8f0",
    margin: "0 0.2rem",
    marginBottom: "0.9rem",
  },
  stepConnectorDone: { backgroundColor: "#10b981" },
  alertCard: {
    margin: "0 0.75rem 0.75rem",
    padding: "0.875rem 1rem",
    borderRadius: "12px",
    border: "1px solid",
  },
  alertLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.2rem",
  },
  alertValue: { fontSize: "2rem", fontWeight: 800, lineHeight: 1 },
  alertDesc: { fontSize: "0.75rem", marginTop: "0.2rem" },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "0 0.75rem 0.75rem",
    padding: "0.875rem 1rem",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  profileAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#3db5e6 0%,#1e40af 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: "0.825rem",
    fontWeight: 600,
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  profileRole: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    marginTop: "0.1rem",
  },
  sidebarFooter: { padding: "0.75rem", borderTop: "1px solid #f1f5f9" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.65rem",
    backgroundColor: "#fff",
    color: "#ef4444",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0.875rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  headerTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  headerBreadcrumb: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.1rem",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  bellBtn: {
    position: "relative",
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  bellBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    backgroundColor: "#ef4444",
    color: "#fff",
    fontSize: "0.6rem",
    fontWeight: 700,
    minWidth: "16px",
    height: "16px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.4rem 0.75rem 0.4rem 0.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  userInfo: { textAlign: "right" },
  userName: { fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" },
  userRole: { fontSize: "0.72rem", color: "#94a3b8" },
  avatarCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#3db5e6 0%,#1e40af 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.75rem",
    flexShrink: 0,
    cursor: "pointer",
  },
  content: { flex: 1, padding: "2rem", overflowY: "auto" },
};
