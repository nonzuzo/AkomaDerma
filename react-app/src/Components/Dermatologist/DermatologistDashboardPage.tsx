import React, { useState } from "react";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Brain,
} from "lucide-react";

export default function DermatologistDashboard() {
  const [filter, setFilter] = useState("all");

  // Mock data
  const stats = [
    {
      label: "Cases Pending Review",
      value: "8",
      icon: Clock,
      color: "#ef4444",
      change: "Needs attention",
    },
    {
      label: "Cases Reviewed Today",
      value: "12",
      icon: CheckCircle,
      color: "#10b981",
      change: "+3 from yesterday",
    },
    {
      label: "Total Cases This Week",
      value: "47",
      icon: FileText,
      color: "#3db5e6",
      change: "On track",
    },
    {
      label: "AI Accuracy Rate",
      value: "94%",
      icon: Brain,
      color: "#8b5cf6",
      change: "+2% this month",
    },
  ];

  const urgentCases = [
    {
      id: "CS-2024-001",
      patient: "Kwame Mensah",
      age: 45,
      condition: "Suspected Melanoma",
      priority: "High",
      submittedBy: "Dr. Sarah Johnson",
      submittedTime: "2 hours ago",
      aiDiagnosis: "Melanoma (92% confidence)",
      images: 3,
    },
    {
      id: "CS-2024-008",
      patient: "Akua Frimpong",
      age: 25,
      condition: "Allergic Reaction",
      priority: "High",
      submittedBy: "Dr. Sarah Johnson",
      submittedTime: "3 hours ago",
      aiDiagnosis: "Contact Dermatitis (88% confidence)",
      images: 2,
    },
    {
      id: "CS-2024-007",
      patient: "Kwabena Agyei",
      age: 34,
      condition: "Fungal Infection",
      priority: "Medium",
      submittedBy: "Dr. Mary Osei",
      submittedTime: "5 hours ago",
      aiDiagnosis: "Tinea Corporis (85% confidence)",
      images: 4,
    },
  ];

  const recentActivity = [
    {
      case: "CS-2024-006",
      patient: "Efua Darko",
      action: "Diagnosis submitted",
      time: "1 hour ago",
      type: "completed",
    },
    {
      case: "CS-2024-005",
      patient: "Yaw Mensah",
      action: "Treatment plan approved",
      time: "2 hours ago",
      type: "completed",
    },
    {
      case: "CS-2024-004",
      patient: "Abena Boateng",
      action: "Requested additional images",
      time: "3 hours ago",
      type: "pending",
    },
    {
      case: "CS-2024-003",
      patient: "Kofi Owusu",
      action: "AI diagnosis accepted",
      time: "4 hours ago",
      type: "completed",
    },
  ];

  const getPriorityColor = (priority) => {
    const colors = {
      High: "#ef4444",
      Medium: "#f59e0b",
      Low: "#10b981",
    };
    return colors[priority] || "#6b7280";
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    logo: {
      fontSize: "1.5rem",
      fontWeight: "bold",
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
    },
    mainContent: {
      padding: "2rem",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    welcome: {
      marginBottom: "2rem",
    },
    welcomeTitle: {
      fontSize: "1.875rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "0.5rem",
    },
    welcomeSubtitle: {
      color: "#64748b",
      fontSize: "1rem",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    statCard: {
      backgroundColor: "#ffffff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    statHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem",
    },
    statLabel: {
      fontSize: "0.875rem",
      color: "#64748b",
      fontWeight: "500",
    },
    statValue: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "0.5rem",
    },
    statChange: {
      fontSize: "0.813rem",
      color: "#64748b",
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "2rem",
      marginBottom: "2rem",
    },
    section: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
    },
    sectionTitle: {
      fontSize: "1.25rem",
      fontWeight: "bold",
      color: "#1e293b",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    filterButtons: {
      display: "flex",
      gap: "0.5rem",
    },
    filterButton: {
      padding: "0.5rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#64748b",
      transition: "all 0.2s",
    },
    activeFilter: {
      backgroundColor: "#3db5e6",
      color: "#ffffff",
      borderColor: "#3db5e6",
    },
    caseCard: {
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "1.5rem",
      marginBottom: "1rem",
      transition: "all 0.2s",
      cursor: "pointer",
    },
    caseHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem",
    },
    caseId: {
      fontFamily: "monospace",
      fontWeight: "600",
      color: "#3db5e6",
      fontSize: "0.95rem",
    },
    patientName: {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#1e293b",
      marginTop: "0.25rem",
    },
    priorityBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: "600",
    },
    caseInfo: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.75rem",
      marginBottom: "1rem",
    },
    infoItem: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
    infoLabel: {
      fontWeight: "500",
      color: "#475569",
    },
    aiDiagnosis: {
      backgroundColor: "#f0f9ff",
      border: "1px solid #bae6fd",
      borderRadius: "6px",
      padding: "0.75rem",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    aiText: {
      fontSize: "0.875rem",
      color: "#0369a1",
      fontWeight: "500",
    },
    reviewButton: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#3db5e6",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "600",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    },
    activityList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    activityItem: {
      padding: "1rem",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    activityCase: {
      fontFamily: "monospace",
      fontSize: "0.813rem",
      color: "#3db5e6",
      fontWeight: "600",
    },
    activityPatient: {
      fontSize: "0.95rem",
      fontWeight: "600",
      color: "#1e293b",
      marginTop: "0.25rem",
    },
    activityAction: {
      fontSize: "0.875rem",
      color: "#64748b",
      marginTop: "0.5rem",
    },
    activityTime: {
      fontSize: "0.75rem",
      color: "#94a3b8",
      marginTop: "0.25rem",
    },
    emptyState: {
      textAlign: "center",
      padding: "3rem 1rem",
      color: "#94a3b8",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: "#3db5e6" }}>Akoma</span>
          <span style={{ color: "#000" }}>Derma</span>
        </div>
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>Dr. Kwesi Boateng</div>
            <div style={styles.userRole}>Dermatologist</div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#3db5e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            KB
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {/* Welcome Section */}
        <div style={styles.welcome}>
          <h1 style={styles.welcomeTitle}>Welcome back, Dr. Boateng</h1>
          <p style={styles.welcomeSubtitle}>
            You have 8 cases awaiting your expert review
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div
              key={index}
              style={styles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
            >
              <div style={styles.statHeader}>
                <div>
                  <div style={styles.statLabel}>{stat.label}</div>
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statChange}>{stat.change}</div>
                </div>
                <div
                  style={{
                    padding: "0.75rem",
                    backgroundColor: stat.color + "15",
                    borderRadius: "10px",
                  }}
                >
                  <stat.icon size={24} color={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div style={styles.contentGrid}>
          {/* Cases Pending Review */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <AlertTriangle size={24} color="#ef4444" />
                Cases Pending Review
              </h2>
              <div style={styles.filterButtons}>
                <button
                  style={{
                    ...styles.filterButton,
                    ...(filter === "all" ? styles.activeFilter : {}),
                  }}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  style={{
                    ...styles.filterButton,
                    ...(filter === "urgent" ? styles.activeFilter : {}),
                  }}
                  onClick={() => setFilter("urgent")}
                >
                  Urgent
                </button>
              </div>
            </div>

            {urgentCases.map((caseItem, index) => (
              <div
                key={index}
                style={styles.caseCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3db5e6";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={styles.caseHeader}>
                  <div>
                    <div style={styles.caseId}>{caseItem.id}</div>
                    <div style={styles.patientName}>
                      {caseItem.patient}, {caseItem.age}
                    </div>
                  </div>
                  <div
                    style={{
                      ...styles.priorityBadge,
                      backgroundColor:
                        getPriorityColor(caseItem.priority) + "15",
                      color: getPriorityColor(caseItem.priority),
                    }}
                  >
                    {caseItem.priority} Priority
                  </div>
                </div>

                <div style={styles.caseInfo}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Condition:</span>{" "}
                    {caseItem.condition}
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Images:</span>{" "}
                    {caseItem.images} uploaded
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Submitted by:</span>{" "}
                    {caseItem.submittedBy}
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Time:</span>{" "}
                    {caseItem.submittedTime}
                  </div>
                </div>

                <div style={styles.aiDiagnosis}>
                  <Brain size={18} color="#0369a1" />
                  <span style={styles.aiText}>
                    AI Diagnosis: {caseItem.aiDiagnosis}
                  </span>
                </div>

                <button
                  style={styles.reviewButton}
                  onClick={() => alert(`Review case ${caseItem.id}`)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#2a8fb5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#3db5e6")
                  }
                >
                  <Eye size={18} />
                  Review Case
                </button>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <TrendingUp size={24} color="#3db5e6" />
                Recent Activity
              </h2>
            </div>

            <div style={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <div style={styles.activityCase}>{activity.case}</div>
                  <div style={styles.activityPatient}>{activity.patient}</div>
                  <div style={styles.activityAction}>{activity.action}</div>
                  <div style={styles.activityTime}>{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
