import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FolderOpen,
  Plus,
  LogOut,
  Bell,
} from "lucide-react";

export default function ClinicianLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // LIVE DATABASE STATE
  const [clinician, setClinician] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // TOKEN SYNC WITH LOGIN
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      setToken(newToken);
    };

    window.addEventListener("storage", handleStorageChange);
    setToken(localStorage.getItem("token"));

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // FETCH LIVE DATA
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    fetchClinicianProfile();
    fetchNotificationCount();
  }, [token]);

  // CLINICIAN FROM DATABASE
  const fetchClinicianProfile = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/clinicians/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClinician({
          name: data.fullName || data.name || "Clinician",
          clinicianId: data.clinicianId || "N/A",
          clinicName: data.clinicName || "Rabito Clinic",
          initials: getInitials(data.fullName || data.name),
        });
      }
    } catch (error) {
      console.error("Profile fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // YOUR NOTIFICATIONS FROM DATABASE
  const fetchNotificationCount = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/clinicians/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotificationsCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Notifications failed:", error);
      setNotificationsCount(0);
    }
  };

  const getInitials = (name) => {
    if (!name) return "CD";
    const names = name.split(" ");
    return names[0][0].toUpperCase() + (names[1]?.[0].toUpperCase() || "D");
  };

  const handleLogout = async () => {
    if (window.confirm("Logout from AkomaDerma?")) {
      try {
        await fetch("http://localhost:5001/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.log("Logout API optional");
      } finally {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    }
  };

  const navItems = [
    { path: "/clinician/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/clinician/appointments", label: "Appointments", icon: Calendar },
    { path: "/clinician/patients", label: "Patients", icon: Users },
    { path: "/clinician/create-case", label: "Create Case", icon: Plus },
    { path: "/clinician/cases", label: "My Cases", icon: FolderOpen },
  ];

  const isActive = (path) => location.pathname === path;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <div style={styles.loadingText}>Loading AkomaDerma...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoAkoma}>Akoma</span>
            <span style={styles.logoDerma}>Derma</span>
          </div>
          {clinician?.clinicName && (
            <div style={styles.clinicInfo}>
              <div style={styles.clinicName}>{clinician.clinicName}</div>
            </div>
          )}
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : styles.navItemInactive),
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
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.color = "#ef4444";
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={styles.mainArea}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Clinician Portal</h1>
          <div style={styles.userSection}>
            {/* LIVE NOTIFICATIONS */}
            <button
              style={styles.notificationBtn(notificationsCount > 0)}
              title="Notifications"
            >
              <Bell size={20} />
              {notificationsCount > 0 && (
                <span style={styles.notificationBadge}>
                  {notificationsCount}
                </span>
              )}
            </button>

            {/* LIVE CLINICIAN DATA */}
            {clinician ? (
              <>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{clinician.name}</div>
                  <div style={styles.userRole}>
                    <span style={styles.roleBadge}>Clinician</span>
                    <span style={styles.roleId}>#{clinician.clinicianId}</span>
                  </div>
                </div>
                <div style={styles.avatar}>{clinician.initials}</div>
              </>
            ) : (
              <div style={styles.loadingUser}>Loading...</div>
            )}
          </div>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

//  ORIGINAL STYLES + NEW DATABASE FEATURES
const styles = {
  //  STYLES
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sidebarHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center",
  },
  logoAkoma: {
    color: "#3db5e6",
  },
  logoDerma: {
    color: "#000",
  },
  clinicInfo: {
    marginTop: "1rem",
    padding: "0.5rem",
    backgroundColor: "#eff6ff",
    border: "1px solid #3b82f6",
    borderRadius: "6px",
  },
  clinicName: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#3b82f6",
    textAlign: "center",
  },
  nav: {
    flex: 1,
    padding: "1.5rem 1rem",
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    marginBottom: "0.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.2s",
    color: "#64748b",
  },
  navItemActive: {
    backgroundColor: "#3db5e6",
    color: "#ffffff",
  },
  navItemInactive: {
    backgroundColor: "transparent",
    color: "#64748b",
  },
  sidebarFooter: {
    padding: "1rem",
    borderTop: "1px solid #e2e8f0",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#ffffff",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userInfo: {
    textAlign: "right",
  },
  userName: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "0.95rem",
  },
  userRole: {
    fontSize: "0.85rem",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  roleBadge: {
    backgroundColor: "#3db5e620",
    color: "#3db5e6",
    padding: "0.125rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
  },
  roleId: {
    color: "#64748b",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#3db5e6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: "2rem",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    overflowY: "auto",
  },

  // NEW DATABASE STYLES
  notificationBtn: (hasNotifications) => ({
    position: "relative",
    padding: "0.5rem",
    backgroundColor: hasNotifications ? "#fef3c7" : "#f8fafc",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  }),
  notificationBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    backgroundColor: "#ef4444",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f8fafc",
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #3db5e6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "1rem",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: "500",
  },
  loadingUser: {
    padding: "0.5rem 1rem",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
};
