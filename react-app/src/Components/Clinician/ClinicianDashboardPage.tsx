// src/Components/Clinician/ClinicianDashboardPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Calendar,
  Users,
  FileText,
  UserPlus,
  LayoutList,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Activity,
  Stethoscope,
} from "lucide-react";

const API = "http://localhost:5001/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  appointmentsToday: number;
  checkedInNow: number;
  walkInQueue: number;
  casesCreatedToday: number;
  sentToDerm: number;
  treatmentReady: number;
  completedCases: number;
  pendingAppointments: number;
}

interface ClinicianInfo {
  full_name: string;
  clinic_name: string;
  clinician_id: number;
}

interface Notification {
  notification_id: number;
  message: string;
  type:
    | "case_update"
    | "treatment_ready"
    | "diagnosis_ready"
    | "appointment"
    | "general";
  is_read: 0 | 1;
  created_at: string;
}

interface UpcomingAppointment {
  appointment_id: number;
  appointment_date: string;
  status: string;
  reason_for_visit: string;
  patient_name: string;
  patient_id: number;
  is_walkin: 0 | 1;
}

interface NextAppointment {
  appointment_id: number;
  appointment_date: string;
  patient_name: string;
  patient_id: number;
  reason_for_visit: string;
  phone: string;
}

interface PatientSearchResult {
  patient_id: number;
  name: string;
  phone: string;
}

interface NewPatientForm {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dob: string;
  occupation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
  });

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getNotifColors = (type: string, isRead: boolean) => {
  if (isRead) return { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280" };
  const map: Record<string, { bg: string; border: string; text: string }> = {
    treatment_ready: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
    diagnosis_ready: { bg: "#f0fdf4", border: "#10b981", text: "#065f46" },
    case_update: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
    appointment: { bg: "#f0fdf4", border: "#10b981", text: "#065f46" },
    general: { bg: "#f0f9ff", border: "#3db5e6", text: "#0c4a6e" },
  };
  return map[type] ?? map.general;
};

const getNotifLabel = (type: string) => {
  const labels: Record<string, string> = {
    treatment_ready: "Treatment Plan Ready",
    diagnosis_ready: "Diagnosis Submitted",
    case_update: "Case Update",
    appointment: "Appointment",
    general: "Notification",
  };
  return labels[type] ?? "Notification";
};

const EMPTY_STATS: DashboardStats = {
  appointmentsToday: 0,
  checkedInNow: 0,
  walkInQueue: 0,
  casesCreatedToday: 0,
  sentToDerm: 0,
  treatmentReady: 0,
  completedCases: 0,
  pendingAppointments: 0,
};

const EMPTY_FORM: NewPatientForm = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: "",
  dob: "",
  occupation: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClinicianDashboard() {
  const navigate = useNavigate();

  // ── 1. useState declarations ───────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [clinician, setClinician] = useState<ClinicianInfo | null>(null);
  const [nextAppointment, setNextAppt] = useState<NextAppointment | null>(null);
  const [upcomingToday, setUpcomingToday] = useState<UpcomingAppointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<NewPatientForm>(EMPTY_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── 2. useRef declarations ─────────────────────────────────────────────────
  const searchRef = useRef<HTMLDivElement>(null);
  const autoRefRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 3. Auth helpers ────────────────────────────────────────────────────────
  const token = () => localStorage.getItem("token") ?? "";
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  // ── 4. fetchDashboard — defined BEFORE all useEffects that reference it ────
  // This order is critical: JavaScript's temporal dead zone means a const
  // cannot be accessed before its declaration line, even inside a useEffect.
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/clinicians/dashboard`, {
        headers: authHeader(),
      });

      // Token expired or invalid — clear token and send to login
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Populate all dashboard state from the single API response
      setStats(data.stats ?? EMPTY_STATS);
      setClinician(data.clinician ?? null);
      setNextAppt(data.nextAppointment ?? null);
      setUpcomingToday(data.upcomingToday ?? []);
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Could not load dashboard. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── 5. useEffects — all after fetchDashboard ───────────────────────────────

  // Redirect to login if no token found in localStorage
  useEffect(() => {
    if (!token()) navigate("/login", { replace: true });
  }, []);

  // Close the patient search dropdown when clicking outside the search box
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close the new patient modal when the Escape key is pressed
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Initial data load when the component mounts
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh every 5 minutes as a fallback for any missed socket events
  useEffect(() => {
    autoRefRef.current = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => {
      if (autoRefRef.current) clearInterval(autoRefRef.current);
    };
  }, [fetchDashboard]);

  // WebSocket listener — fires fetchDashboard immediately when the dermatologist
  // submits a diagnosis or treatment plan so stats and notifications update
  // without waiting for the 5-minute auto-refresh interval
  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;

    const handleNotification = (data: { type: string }) => {
      if (data.type === "diagnosis_ready" || data.type === "treatment_ready") {
        fetchDashboard();
      }
    };

    socket.on("notification", handleNotification);
    // Remove the listener on unmount to prevent duplicate registrations
    return () => socket.off("notification", handleNotification);
  }, [fetchDashboard]);

  // Debounced patient search — waits 300ms after the user stops typing
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `${API}/clinicians/patients/search?q=${encodeURIComponent(
            searchQuery
          )}`,
          { headers: authHeader() }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.patients ?? []);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── 6. Handler functions ───────────────────────────────────────────────────

  // Mark a single notification as read — optimistic update, no full re-fetch
  const markOneRead = async (id: number) => {
    try {
      await fetch(`${API}/clinicians/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeader(),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: 1 as const } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("markOneRead error:", err);
    }
  };

  // Mark every notification as read in a single bulk request
  const markAllRead = async () => {
    try {
      await fetch(`${API}/clinicians/notifications/read-all`, {
        method: "PATCH",
        headers: authHeader(),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: 1 as const }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("markAllRead error:", err);
    }
  };

  // Submit the new patient registration form
  const handleNewPatientSubmit = async () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim()
    ) {
      alert("First name, last name, and phone are required.");
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await fetch(`${API}/clinicians/patients/new`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.replace(/\D/g, ""),
          gender: formData.gender || "other",
          date_of_birth: formData.dob || null,
          occupation: formData.occupation || null,
        }),
      });

      const body = await res.json();

      if (res.ok) {
        setShowModal(false);
        setFormData(EMPTY_FORM);
        navigate(
          `/clinician/create-case?patient_id=${body.patient_id}&new_patient=true`
        );
      } else if (res.status === 409) {
        // Duplicate patient phone — ask if they want to open the existing record
        if (
          window.confirm(`${body.message}\n\nOpen existing patient record?`)
        ) {
          navigate(`/clinician/patients/${body.patient_id}`);
          setShowModal(false);
          setFormData(EMPTY_FORM);
        }
      } else {
        alert(body.message || "Failed to create patient.");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── 7. Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <div style={{ color: "#64748b", fontSize: "1rem", marginTop: "1rem" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  const todayLabel = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── 8. Render ──────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Error banner */}
      {error && (
        <div style={s.errorBanner}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={s.retryBtn} onClick={fetchDashboard}>
            Retry
          </button>
        </div>
      )}

      {/* Page header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.greeting}>
            {greeting()}, {clinician?.full_name?.split(" ")[0] ?? "Doctor"} 👋
          </h1>
          <p style={s.subheader}>
            {clinician?.clinic_name && (
              <span style={s.clinicTag}>
                <Stethoscope size={12} />
                {clinician.clinic_name}
              </span>
            )}
            {todayLabel}
          </p>
        </div>
        <button style={s.refreshBtn} onClick={fetchDashboard}>
          <RefreshCw size={15} />
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString("en-GH", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Refresh"}
        </button>
      </div>

      {/* Next appointment banner */}
      {nextAppointment && (
        <div
          style={s.nextApptBanner}
          onClick={() => navigate("/clinician/appointments")}
        >
          <div style={s.nextApptLeft}>
            <Clock size={22} style={{ color: "#3db5e6", flexShrink: 0 }} />
            <div>
              <div style={s.nextApptLabel}>Next Appointment</div>
              <div style={s.nextApptName}>{nextAppointment.patient_name}</div>
              {nextAppointment.reason_for_visit && (
                <div style={s.nextApptReason}>
                  {nextAppointment.reason_for_visit}
                </div>
              )}
            </div>
          </div>
          <div style={s.nextApptRight}>
            <div style={s.nextApptTime}>
              {formatTime(nextAppointment.appointment_date)}
            </div>
            <ChevronRight size={18} style={{ color: "#3db5e6" }} />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={s.statsGrid}>
        <StatCard
          icon={<Calendar size={30} />}
          accent="#3db5e6"
          bg="#e0f2fe"
          title="Appointments Today"
          value={stats.appointmentsToday}
          onClick={() => navigate("/clinician/appointments")}
        />
        <StatCard
          icon={<CheckCircle size={30} />}
          accent="#10b981"
          bg="#d1fae5"
          title="Checked In Now"
          value={stats.checkedInNow}
          onClick={() => navigate("/clinician/appointments")}
        />
        <StatCard
          icon={<Users size={30} />}
          accent="#8b5cf6"
          bg="#ede9fe"
          title="Walk-in Queue"
          value={stats.walkInQueue}
          onClick={() => navigate("/clinician/appointments")}
        />
        <StatCard
          icon={<FileText size={30} />}
          accent="#f59e0b"
          bg="#fef3c7"
          title="Cases Today"
          value={stats.casesCreatedToday}
          onClick={() => navigate("/clinician/cases")}
        />
        <StatCard
          icon={<FileText size={30} />}
          accent="#ef4444"
          bg="#fee2e2"
          title="Sent to Derm"
          value={stats.sentToDerm}
          onClick={() => navigate("/clinician/cases")}
        />
        {/* Highlighted when action is needed from the clinician */}
        <StatCard
          icon={<Activity size={30} />}
          accent="#06b6d4"
          bg="#cffafe"
          title="Treatment Ready"
          value={stats.treatmentReady}
          highlight={stats.treatmentReady > 0}
          onClick={() => navigate("/clinician/cases?tab=treatment_ready")}
        />
        <StatCard
          icon={<CheckCircle size={30} />}
          accent="#059669"
          bg="#d1fae5"
          title="Completed Cases"
          value={stats.completedCases}
          onClick={() => navigate("/clinician/cases?tab=completed")}
        />
      </div>

      {/* Treatment ready alert — only shown when there are pending results */}
      {stats.treatmentReady > 0 && (
        <div
          style={s.treatmentReadyBanner}
          onClick={() => navigate("/clinician/cases?tab=treatment_ready")}
        >
          <CheckCircle size={20} style={{ color: "#059669", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>
              {stats.treatmentReady} case{stats.treatmentReady > 1 ? "s" : ""}{" "}
              ready for review
            </strong>
            <div
              style={{
                fontSize: "0.82rem",
                color: "#065f46",
                marginTop: "0.15rem",
              }}
            >
              The dermatologist has submitted a diagnosis and treatment plan.
              Click to review.
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "#059669" }} />
        </div>
      )}

      {/* Main content grid */}
      <div style={s.mainGrid}>
        {/* Today's Queue */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <Clock size={20} style={{ color: "#3db5e6" }} />
            <h3 style={s.cardTitle}>Today's Queue</h3>
            <button
              style={s.linkBtn}
              onClick={() => navigate("/clinician/appointments")}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          {upcomingToday.length === 0 ? (
            <EmptyState text="No upcoming appointments today" />
          ) : (
            upcomingToday.map((appt, i) => (
              <QueueRow
                key={appt.appointment_id}
                index={i + 1}
                appt={appt}
                onClick={() => navigate("/clinician/appointments")}
              />
            ))
          )}
        </div>

        {/* Patient Search */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <Search size={20} style={{ color: "#3db5e6" }} />
            <h3 style={s.cardTitle}>Find Patient</h3>
          </div>
          <div ref={searchRef} style={{ position: "relative" }}>
            <Search size={15} style={s.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={s.searchInput}
            />
            {searchLoading && <span style={s.searchSpinner}>Searching...</span>}
            {showResults && (
              <div style={s.searchDropdown}>
                {searchResults.length === 0 ? (
                  <div style={s.emptyDropdown}>No patients found</div>
                ) : (
                  searchResults.map((p) => (
                    <div
                      key={p.patient_id}
                      style={s.searchRow}
                      onClick={() => {
                        navigate(`/clinician/patients/${p.patient_id}`);
                        setSearchQuery("");
                        setShowResults(false);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e0f2fe")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                    >
                      <div style={s.avatar}>
                        {(p.name?.[0] ?? "P").toUpperCase()}
                      </div>
                      <div>
                        <div style={s.searchPatientName}>{p.name}</div>
                        <div style={s.searchPatientMeta}>
                          ID: {p.patient_id} · {p.phone}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <Bell size={20} style={{ color: "#f59e0b" }} />
            <h3 style={s.cardTitle}>
              Notifications
              {unreadCount > 0 && (
                <span style={s.unreadBadge}>{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button style={s.linkBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <EmptyState text="No notifications" />
            ) : (
              notifications.map((n) => {
                const colors = getNotifColors(n.type, n.is_read === 1);
                return (
                  <div
                    key={n.notification_id}
                    style={{
                      ...s.notifItem,
                      backgroundColor: colors.bg,
                      borderLeft: `4px solid ${colors.border}`,
                      opacity: n.is_read ? 0.65 : 1,
                      cursor: n.is_read ? "default" : "pointer",
                    }}
                    onClick={() =>
                      n.is_read === 0 && markOneRead(n.notification_id)
                    }
                  >
                    {/* Type label above the message */}
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: colors.border,
                        marginBottom: "0.2rem",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {getNotifLabel(n.type)}
                    </div>
                    <div
                      style={{
                        color: colors.text,
                        fontSize: "0.88rem",
                        fontWeight: 500,
                      }}
                    >
                      {n.message}
                    </div>
                    <div style={s.notifMeta}>
                      {timeAgo(n.created_at)}
                      {n.is_read === 0 && <span style={s.unreadDot} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={s.card}>
          <h3 style={{ ...s.cardTitle, marginBottom: "1.25rem" }}>
            Quick Actions
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            <QuickAction
              color="#3db5e6"
              icon={<UserPlus size={18} />}
              label="Register New Patient"
              sub="Walk-in registration → create case"
              onClick={() => setShowModal(true)}
            />
            <QuickAction
              color="#10b981"
              icon={<Calendar size={18} />}
              label="Appointments"
              sub="View and manage today's schedule"
              onClick={() => navigate("/clinician/appointments")}
            />
            <QuickAction
              color="#8b5cf6"
              icon={<LayoutList size={18} />}
              label="My Cases"
              sub="View all submitted cases"
              onClick={() => navigate("/clinician/cases")}
            />
            <QuickAction
              color="#06b6d4"
              icon={<Activity size={18} />}
              label="Treatment Ready Cases"
              sub="Review dermatologist diagnoses and plans"
              onClick={() => navigate("/clinician/cases?tab=treatment_ready")}
            />
            <QuickAction
              color="#f59e0b"
              icon={<Users size={18} />}
              label="All Patients"
              sub="Browse patient records"
              onClick={() => navigate("/clinician/patients")}
            />
          </div>
        </div>
      </div>

      {/* New Patient Modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Register New Patient</h2>
                <p style={s.modalSub}>
                  Walk-in registration — will proceed to case creation
                </p>
              </div>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div style={s.formRow}>
              <Field label="First Name *">
                <input
                  style={s.input}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </Field>
              <Field label="Last Name *">
                <input
                  style={s.input}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </Field>
            </div>
            <div style={s.formRow}>
              <Field label="Phone *">
                <input
                  style={s.input}
                  placeholder="0551234567"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="Gender">
                <select
                  style={s.input}
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
            <div style={s.formRow}>
              <Field label="Date of Birth">
                <input
                  type="date"
                  style={s.input}
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                />
              </Field>
              <Field label="Occupation">
                <input
                  style={s.input}
                  placeholder="Farmer, Teacher..."
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                />
              </Field>
            </div>
            <div style={s.modalBtns}>
              <button
                style={s.secondaryBtn}
                onClick={() => {
                  setShowModal(false);
                  setFormData(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.primaryBtn,
                  opacity:
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.phone ||
                    formSubmitting
                      ? 0.5
                      : 1,
                  cursor:
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.phone ||
                    formSubmitting
                      ? "not-allowed"
                      : "pointer",
                }}
                onClick={handleNewPatientSubmit}
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.phone ||
                  formSubmitting
                }
              >
                {formSubmitting ? "Creating..." : "Create Patient → Open Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  title,
  value,
  accent,
  bg,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  accent: string;
  bg: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        ...s.statCard,
        boxShadow: highlight
          ? `0 0 0 2px ${accent}, 0 4px 12px rgba(0,0,0,0.08)`
          : "0 2px 8px rgba(0,0,0,0.06)",
      }}
      onClick={onClick}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-2px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
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

function QueueRow({
  index,
  appt,
  onClick,
}: {
  index: number;
  appt: UpcomingAppointment;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...s.queueRow,
        backgroundColor: hovered ? "#f0f9ff" : "#f8fafc",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={s.queueNum}>#{index}</span>
      <span style={s.queueTime}>{formatTime(appt.appointment_date)}</span>
      <div style={{ flex: 1 }}>
        <div style={s.queueName}>{appt.patient_name}</div>
        {appt.reason_for_visit && (
          <div style={s.queueReason}>{appt.reason_for_visit}</div>
        )}
      </div>
      <span
        style={{
          ...s.queueBadge,
          backgroundColor: appt.status === "checked_in" ? "#d1fae5" : "#e0f2fe",
          color: appt.status === "checked_in" ? "#065f46" : "#0c4a6e",
        }}
      >
        {appt.status === "checked_in" ? "In" : "Booked"}
        {appt.is_walkin ? " · Walk-in" : ""}
      </span>
    </div>
  );
}

function QuickAction({
  color,
  icon,
  label,
  sub,
  onClick,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        ...s.qaBtn,
        borderLeft: `4px solid ${color}`,
        backgroundColor: hovered ? "#f8fafc" : "#ffffff",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...s.qaIcon, backgroundColor: color + "20", color }}>
        {icon}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={s.qaLabel}>{label}</div>
        <div style={s.qaSub}>{sub}</div>
      </div>
      <ChevronRight size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={s.emptyState}>{text}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  greeting: {
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
  clinicTag: {
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
  nextApptBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "2px solid #3db5e6",
    borderRadius: "16px",
    padding: "1.25rem 1.75rem",
    marginBottom: "1.5rem",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(61,181,230,0.12)",
  },
  nextApptLeft: { display: "flex", alignItems: "center", gap: "1rem" },
  nextApptLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#3db5e6",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  nextApptName: { fontSize: "1.05rem", fontWeight: 700, color: "#111827" },
  nextApptReason: {
    fontSize: "0.82rem",
    color: "#64748b",
    marginTop: "0.15rem",
  },
  nextApptRight: { display: "flex", alignItems: "center", gap: "0.5rem" },
  nextApptTime: { fontSize: "1.35rem", fontWeight: 700, color: "#3db5e6" },
  treatmentReadyBanner: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    backgroundColor: "#f0fdf4",
    border: "2px solid #10b981",
    borderRadius: "14px",
    padding: "1rem 1.5rem",
    marginBottom: "1.5rem",
    cursor: "pointer",
    color: "#065f46",
  },
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
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "1.75rem",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  linkBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    color: "#3db5e6",
    background: "none",
    border: "none",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    color: "#9ca3af",
    fontStyle: "italic",
    padding: "1.5rem",
    fontSize: "0.88rem",
  },
  queueRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "0.6rem",
    transition: "background-color 0.15s",
  },
  queueNum: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#9ca3af",
    minWidth: 24,
  },
  queueTime: {
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#3db5e6",
    minWidth: 50,
  },
  queueName: { fontSize: "0.92rem", fontWeight: 600, color: "#111827" },
  queueReason: { fontSize: "0.76rem", color: "#6b7280" },
  queueBadge: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.25rem 0.6rem",
    borderRadius: "20px",
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
  },
  searchSpinner: {
    position: "absolute",
    right: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#3db5e6",
    fontSize: "0.82rem",
  },
  searchDropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "calc(100% + 6px)",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    zIndex: 50,
    maxHeight: 260,
    overflowY: "auto",
  },
  emptyDropdown: {
    padding: "1rem",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "0.88rem",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
    backgroundColor: "#f8fafc",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#3db5e6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.92rem",
    flexShrink: 0,
  },
  searchPatientName: { fontWeight: 600, color: "#1e293b", fontSize: "0.88rem" },
  searchPatientMeta: { fontSize: "0.75rem", color: "#6b7280" },
  unreadBadge: {
    backgroundColor: "#ef4444",
    color: "white",
    borderRadius: "20px",
    padding: "0.1rem 0.5rem",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  notifItem: {
    padding: "0.85rem 1rem",
    borderRadius: "8px",
    marginBottom: "0.6rem",
    transition: "opacity 0.2s",
  },
  notifMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.73rem",
    color: "#9ca3af",
    marginTop: "0.3rem",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#3db5e6",
    display: "inline-block",
  },
  qaBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    padding: "0.85rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
  },
  qaIcon: {
    width: 36,
    height: 36,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  qaLabel: { fontWeight: 600, color: "#111827", fontSize: "0.88rem" },
  qaSub: { fontSize: "0.75rem", color: "#6b7280" },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "20px",
    maxWidth: "520px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  modalTitle: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  modalSub: { color: "#6b7280", fontSize: "0.88rem", margin: "0.25rem 0 0 0" },
  closeBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    width: 36,
    height: 36,
    fontSize: "1.25rem",
    cursor: "pointer",
    flexShrink: 0,
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.25rem",
    flexWrap: "wrap",
  },
  fieldLabel: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.4rem",
  },
  input: {
    width: "100%",
    padding: "0.8rem 1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "0.92rem",
    outline: "none",
    boxSizing: "border-box",
  },
  modalBtns: { display: "flex", gap: "1rem", marginTop: "1.5rem" },
  primaryBtn: {
    flex: 1,
    padding: "0.9rem",
    backgroundColor: "#3db5e6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.92rem",
    cursor: "pointer",
  },
  secondaryBtn: {
    flex: 1,
    padding: "0.9rem",
    backgroundColor: "transparent",
    color: "#374151",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.92rem",
    cursor: "pointer",
  },
};
