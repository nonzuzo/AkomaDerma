import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  Eye,
  Brain,
  Pill,
  TrendingUp,
  LogOut,
} from "lucide-react";

export default function DermatologistLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    sidebar: {
      width: "280px",
      backgroundColor: "#ffffff",
      borderRight: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column" as const,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    sidebarHeader: {
      padding: "1.5rem",
      borderBottom: "1px solid #e2e8f0",
    },
    logo: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      textAlign: "center" as const,
    },
    nav: {
      flex: 1,
      padding: "1.5rem 1rem",
      overflowY: "auto" as const,
    },
    sectionLabel: {
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#94a3b8",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      marginBottom: "0.75rem",
      marginTop: "1rem",
      paddingLeft: "1rem",
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
    statsCard: {
      margin: "1rem",
      padding: "1rem",
      backgroundColor: "#fef2f2",
      borderRadius: "8px",
      border: "1px solid #fecaca",
    },
    statsLabel: {
      fontSize: "0.75rem",
      color: "#991b1b",
      marginBottom: "0.25rem",
      fontWeight: "600",
      textTransform: "uppercase" as const,
    },
    statsValue: {
      fontSize: "1.75rem",
      fontWeight: "bold",
      color: "#ef4444",
    },
    statsDesc: {
      fontSize: "0.75rem",
      color: "#991b1b",
      marginTop: "0.25rem",
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
      flexDirection: "column" as const,
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
      textAlign: "right" as const,
    },
    userName: {
      fontWeight: "600",
      color: "#1e293b",
      fontSize: "0.95rem",
    },
    userRole: {
      fontSize: "0.85rem",
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
      overflowY: "auto" as const,
    },
  };

  const navItems = [
    {
      section: "Overview",
      items: [
        {
          path: "/dermatologist/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      section: "Case Review",
      items: [
        {
          path: "/dermatologist/case/CS-2024-001",
          label: "Review Case",
          icon: Eye,
          badge: "Example",
        },
        {
          path: "/dermatologist/diagnosis/CS-2024-001",
          label: "AI Diagnosis Review",
          icon: Brain,
        },
        {
          path: "/dermatologist/treatment/CS-2024-001",
          label: "Provide Treatment",
          icon: Pill,
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    // Check if current path matches or starts with the nav item path
    return (
      location.pathname === path ||
      (path !== "/dermatologist/dashboard" &&
        location.pathname.startsWith(path.split("/").slice(0, 3).join("/")))
    );
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/login");
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={{ color: "#3db5e6" }}>Akoma</span>
            <span style={{ color: "#000" }}>Derma</span>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.section && (
                <div style={styles.sectionLabel}>{section.section}</div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <div
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      ...styles.navItem,
                      ...(active
                        ? styles.navItemActive
                        : styles.navItemInactive),
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
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          backgroundColor: active ? "#ffffff" : "#ef4444",
                          color: active ? "#3db5e6" : "#ffffff",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Pending Cases Alert */}
        <div style={styles.statsCard}>
          <div style={styles.statsLabel}>Urgent</div>
          <div style={styles.statsValue}>8</div>
          <div style={styles.statsDesc}>Cases need attention</div>
        </div>

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

      {/* Main Content Area */}
      <div style={styles.mainArea}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Dermatologist Portal</h1>
          <div style={styles.userSection}>
            <div style={styles.userInfo}>
              <div style={styles.userName}>Dr. Kwesi Boateng</div>
              <div style={styles.userRole}>Dermatologist</div>
            </div>
            <div style={styles.avatar}>KB</div>
          </div>
        </header>

        {/* Page Content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
