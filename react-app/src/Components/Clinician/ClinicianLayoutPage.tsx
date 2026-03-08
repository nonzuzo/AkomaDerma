// src/Components/Clinician/ClinicianLayoutPage.tsx

import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FolderOpen,
  LogOut,
  Bell,
  ChevronRight,
  X,
  CreditCard,
  Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Clinician {
  name: string;
  clinicianId: number | string;
  clinicName: string;
  initials: string;
}

interface Notification {
  notification_id: number;
  message: string;
  type: "case_update" | "treatment_ready" | "appointment" | "general";
  is_read: boolean;
  created_at: string;
}

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/clinician/dashboard": "Dashboard",
  "/clinician/appointments": "Appointments",
  "/clinician/patients": "Patients",
  "/clinician/cases": "My Cases",
  "/clinician/billing": "Billing",
};

const getPageTitle = (pathname: string) => {
  if (
    pathname.includes("/clinician/patients/") &&
    pathname !== "/clinician/patients"
  )
    return "Patient Profile";
  if (pathname.includes("/clinician/create-case")) return "Create Case";
  if (pathname.includes("/clinician/cases/")) return "Case Details";
  if (pathname.includes("/clinician/billing/")) return "New Invoice";
  return PAGE_TITLES[pathname] || "Clinician Portal";
};

// ─── Notification colour ──────────────────────────────────────────────────────
const getNotifStyle = (type: string, isRead: boolean) => {
  if (isRead) return { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280" };
  const map: Record<string, { bg: string; border: string; text: string }> = {
    treatment_ready: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
    case_update: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
    appointment: { bg: "#f0fdf4", border: "#10b981", text: "#065f46" },
    general: { bg: "#f0f9ff", border: "#3db5e6", text: "#0c4a6e" },
  };
  return map[type] || map.general;
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function ClinicianLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const notifPanelRef = useRef<HTMLDivElement>(null);

  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token] = useState(() => localStorage.getItem("token"));

  // ── Close notif panel on outside click ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(e.target as Node)
      ) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    fetchClinicianProfile();
    fetchNotifications();
  }, [token]);

  // ── Clinician profile ─────────────────────────────────────────────────────
  const fetchClinicianProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clinicians/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const name = data.fullName || data.full_name || data.name || "Clinician";
      setClinician({
        name,
        clinicianId: data.clinician?.clinician_id || data.clinicianId || "",
        clinicName: data.clinician?.clinic_name || data.clinicName || "Clinic",
        initials: getInitials(name),
      });
    } catch (error) {
      console.error("Profile fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/clinicians/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Notifications fetch failed:", error);
    }
  };

  const markRead = async (id: number) => {
    try {
      await fetch(
        `import.meta.env.VITE_API_URL/clinicians/notifications/${id}/read`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/clinicians/notifications/read-all`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "CD";
    const parts = name.trim().split(" ");
    return (
      (parts[0]?.[0] || "C").toUpperCase() +
      (parts[1]?.[0] || "D").toUpperCase()
    );
  };

  const handleLogout = async () => {
    if (!window.confirm("Logout from AkomaDerma?")) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    {
      path: "/clinician/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & stats",
    },
    {
      path: "/clinician/appointments",
      label: "Appointments",
      icon: Calendar,
      description: "Today's schedule",
    },
    {
      path: "/clinician/patients",
      label: "Patients",
      icon: Users,
      description: "Patient records",
    },
    {
      path: "/clinician/cases",
      label: "Cases",
      icon: FolderOpen,
      description: "Sent to dermatologist",
    },
    {
      path: "/clinician/billing",
      label: "Billing",
      icon: CreditCard,
      description: "Payments & invoices",
    },
  ];

  // ── Active check — billing matches any /clinician/billing/* sub-route ─────
  const isActive = (path: string) => {
    if (path === "/clinician/dashboard") return location.pathname === path;
    if (path === "/clinician/billing")
      return location.pathname.startsWith("/clinician/billing");
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div style={loadingScreen}>
        <div style={spinner} />
        <div style={loadingText}>Loading AkomaDerma...</div>
      </div>
    );
  }

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div style={container}>
      {/* ── Sidebar ── */}
      <aside style={sidebar}>
        {/* Logo + clinic */}
        <div style={sidebarHeader}>
          <div style={logo}>
            <span style={{ color: "#3db5e6" }}>Akoma</span>
            <span style={{ color: "#1e293b" }}>Derma</span>
          </div>
          <div style={clinicBadge}>
            <Activity size={12} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <span style={clinicName}>{clinician?.clinicName || "Clinic"}</span>
          </div>
          <div style={workflowNote}>
            Patient → Case → Derm → Treatment → Billing
          </div>
        </div>

        {/* Nav */}
        <nav style={nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{ ...navItem, ...(active ? navItemActive : {}) }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    ...navIcon,
                    backgroundColor: active
                      ? "rgba(255,255,255,0.2)"
                      : "#f1f5f9",
                    color: active ? "#fff" : "#64748b",
                  }}
                >
                  <Icon size={17} />
                </div>
                <div style={navText}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      opacity: 0.8,
                      color: active ? "rgba(255,255,255,0.85)" : "#9ca3af",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
                {active && (
                  <ChevronRight
                    size={14}
                    style={{ color: "rgba(255,255,255,0.6)", flexShrink: 0 }}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={sidebarFooter}>
          {clinician && (
            <div style={userCard}>
              <div style={userAvatar}>{clinician.initials}</div>
              <div style={userInfo}>
                <div style={userName}>{clinician.name}</div>
                <div style={userMeta}>Clinician #{clinician.clinicianId}</div>
              </div>
            </div>
          )}
          <button
            style={logoutBtn}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#ef4444";
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={mainArea}>
        {/* ── Top header ── */}
        <header style={topHeader}>
          <div>
            <h1 style={headerTitle}>{pageTitle}</h1>
            <p style={headerBreadcrumb}>AkomaDerma · {clinician?.clinicName}</p>
          </div>

          <div style={headerRight}>
            {/* Notification bell + panel */}
            <div style={{ position: "relative" as const }} ref={notifPanelRef}>
              <button
                style={{
                  ...notifBtn,
                  backgroundColor: unreadCount > 0 ? "#fffbeb" : "#f8fafc",
                  border:
                    unreadCount > 0
                      ? "1.5px solid #f59e0b"
                      : "1.5px solid #e5e7eb",
                }}
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                title="Notifications"
              >
                <Bell
                  size={19}
                  style={{ color: unreadCount > 0 ? "#f59e0b" : "#64748b" }}
                />
                {unreadCount > 0 && (
                  <span style={notifBadge}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifPanel && (
                <div style={notifPanel}>
                  <div style={notifPanelHeader}>
                    <span style={notifPanelTitle}>
                      Notifications
                      {unreadCount > 0 && (
                        <span style={notifCount}>{unreadCount} unread</span>
                      )}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      {unreadCount > 0 && (
                        <button style={markAllBtn} onClick={markAllRead}>
                          Mark all read
                        </button>
                      )}
                      <button
                        style={closePanelBtn}
                        onClick={() => setShowNotifPanel(false)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={notifList}>
                    {notifications.length === 0 ? (
                      <div style={notifEmpty}>
                        <Bell
                          size={28}
                          style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                        />
                        <div>No notifications</div>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => {
                        const colors = getNotifStyle(n.type, n.is_read);
                        return (
                          <div
                            key={n.notification_id}
                            style={{
                              ...notifItemStyle,
                              backgroundColor: colors.bg,
                              borderLeft: `3px solid ${colors.border}`,
                              opacity: n.is_read ? 0.65 : 1,
                            }}
                            onClick={() =>
                              !n.is_read && markRead(n.notification_id)
                            }
                          >
                            <div
                              style={{
                                color: colors.text,
                                fontSize: "0.875rem",
                                lineHeight: 1.4,
                              }}
                            >
                              {n.message}
                            </div>
                            <div style={notifTimestamp}>
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {!n.is_read && <span style={unreadDot} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {notifications.length > 8 && (
                    <div style={notifFooter}>
                      Showing 8 of {notifications.length}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clinician info */}
            {clinician && (
              <div style={headerUser}>
                <div style={headerUserInfo}>
                  <div style={headerUserName}>{clinician.name}</div>
                  <div style={headerUserMeta}>
                    <span style={roleBadge}>Clinician</span>
                    <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                      #{clinician.clinicianId}
                    </span>
                  </div>
                </div>
                <div style={avatarStyle}>{clinician.initials}</div>
              </div>
            )}
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={contentArea}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const container: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const loadingScreen: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: "#f8fafc",
};

const spinner: React.CSSProperties = {
  width: 44,
  height: 44,
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #3db5e6",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const loadingText: React.CSSProperties = {
  marginTop: "1rem",
  color: "#64748b",
  fontSize: "1rem",
  fontWeight: 500,
};

const sidebar: React.CSSProperties = {
  width: "260px",
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
  flexShrink: 0,
};

const sidebarHeader: React.CSSProperties = {
  padding: "1.5rem",
  borderBottom: "1px solid #f1f5f9",
};

const logo: React.CSSProperties = {
  fontSize: "1.6rem",
  fontWeight: 800,
  textAlign: "center",
  letterSpacing: "-0.5px",
  marginBottom: "0.75rem",
};

const clinicBadge: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "0.4rem 0.75rem",
  marginBottom: "0.5rem",
};

const clinicName: React.CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "#1d4ed8",
  textAlign: "center",
};

const workflowNote: React.CSSProperties = {
  fontSize: "0.65rem",
  color: "#94a3b8",
  textAlign: "center",
  marginTop: "0.4rem",
  letterSpacing: "0.01em",
};

const nav: React.CSSProperties = {
  flex: 1,
  padding: "1rem 0.75rem",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const navItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.75rem 0.875rem",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.15s",
  color: "#64748b",
};

const navItemActive: React.CSSProperties = {
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  color: "#ffffff",
  boxShadow: "0 4px 10px rgba(61,181,230,0.3)",
};

const navIcon: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "all 0.15s",
};

const navText: React.CSSProperties = { flex: 1 };

const sidebarFooter: React.CSSProperties = {
  padding: "1rem",
  borderTop: "1px solid #f1f5f9",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const userCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.75rem",
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
};

const userAvatar: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  backgroundColor: "#3db5e6",
  color: "white",
  fontWeight: 700,
  fontSize: "0.9rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const userInfo: React.CSSProperties = { flex: 1, minWidth: 0 };

const userName: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.85rem",
  color: "#1e293b",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const userMeta: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "#94a3b8",
};

const logoutBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  width: "100%",
  padding: "0.65rem",
  backgroundColor: "transparent",
  color: "#ef4444",
  border: "1px solid #fca5a5",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 600,
  transition: "all 0.2s",
};

const mainArea: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const topHeader: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  padding: "1rem 2rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  position: "sticky" as const,
  top: 0,
  zIndex: 100,
};

const headerTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#1e293b",
  margin: 0,
};

const headerBreadcrumb: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#94a3b8",
  margin: "0.15rem 0 0 0",
};

const headerRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const notifBtn: React.CSSProperties = {
  position: "relative",
  width: 40,
  height: 40,
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s",
};

const notifBadge: React.CSSProperties = {
  position: "absolute",
  top: -4,
  right: -4,
  backgroundColor: "#ef4444",
  color: "white",
  borderRadius: "20px",
  minWidth: 18,
  height: 18,
  fontSize: "0.65rem",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 4px",
};

const notifPanel: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 12px)",
  right: 0,
  width: 360,
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  zIndex: 1000,
  overflow: "hidden",
};

const notifPanelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem 1.25rem",
  borderBottom: "1px solid #f3f4f6",
};

const notifPanelTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "0.95rem",
  color: "#111827",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const notifCount: React.CSSProperties = {
  backgroundColor: "#fee2e2",
  color: "#dc2626",
  fontSize: "0.72rem",
  fontWeight: 700,
  padding: "0.1rem 0.5rem",
  borderRadius: "20px",
};

const markAllBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#3db5e6",
  fontSize: "0.78rem",
  fontWeight: 600,
  cursor: "pointer",
};

const closePanelBtn: React.CSSProperties = {
  background: "#f3f4f6",
  border: "none",
  borderRadius: "6px",
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#6b7280",
};

const notifList: React.CSSProperties = {
  maxHeight: 340,
  overflowY: "auto",
  padding: "0.75rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const notifEmpty: React.CSSProperties = {
  padding: "2rem",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: "0.9rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const notifItemStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const notifTimestamp: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "#9ca3af",
  marginTop: "0.25rem",
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
};

const unreadDot: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: "#3db5e6",
  display: "inline-block",
};

const notifFooter: React.CSSProperties = {
  padding: "0.75rem 1.25rem",
  borderTop: "1px solid #f3f4f6",
  textAlign: "center",
  fontSize: "0.78rem",
  color: "#9ca3af",
};

const headerUser: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
};

const headerUserInfo: React.CSSProperties = { textAlign: "right" };

const headerUserName: React.CSSProperties = {
  fontWeight: 600,
  color: "#1e293b",
  fontSize: "0.9rem",
};

const headerUserMeta: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "0.4rem",
};

const roleBadge: React.CSSProperties = {
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  padding: "0.1rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: 600,
};

const avatarStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #3db5e6, #1e40af)",
  color: "white",
  fontWeight: 700,
  fontSize: "0.95rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const contentArea: React.CSSProperties = {
  flex: 1,
  padding: "2rem",
  overflowY: "auto",
};
