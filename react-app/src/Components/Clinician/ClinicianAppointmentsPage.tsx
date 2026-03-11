// src/Components/Clinician/ClinicianAppointmentsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  User,
  CheckCircle,
  Plus,
  Clock,
  AlertCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Appointment {
  appointment_id: number;
  appointment_time: string;
  status: "booked" | "checked_in" | "completed" | "cancelled" | "no_show";
  notes: string;
  reason_for_visit: string;
  patient_name: string;
  pid: number;
  phone: string;
  sex: string;
  date_of_birth: string;
  ai_summary: string;
  checked_in_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

// PatientResult — matches exactly what searchPatients controller returns:
// { patient_id, full_name, contact_info, case_count }
interface PatientResult {
  patient_id: number;
  full_name: string; // CONCAT(first_name, ' ', last_name)
  contact_info: string; // phone number from patients table
  case_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (timeStr: string) => {
  try {
    return new Date(timeStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return "N/A";
  }
};

const formatDate = (timeStr: string) => {
  try {
    return new Date(timeStr).toLocaleDateString(undefined, {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const isOverdue = (timeStr: string, status: string) =>
  status === "booked" && new Date(timeStr).getTime() < new Date().getTime();

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    { bg: string; color: string; label: string; border: string }
  > = {
    booked: {
      bg: "#3db5e6",
      color: "#fff",
      label: "BOOKED",
      border: "#3db5e6",
    },
    checked_in: {
      bg: "#10b981",
      color: "#fff",
      label: "CHECKED IN",
      border: "#10b981",
    },
    completed: {
      bg: "#6b7280",
      color: "#fff",
      label: "COMPLETED",
      border: "#6b7280",
    },
    cancelled: {
      bg: "#ef4444",
      color: "#fff",
      label: "CANCELLED",
      border: "#ef4444",
    },
    no_show: {
      bg: "#f59e0b",
      color: "#fff",
      label: "NO SHOW",
      border: "#f59e0b",
    },
  };
  return configs[status] || configs.booked;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClinicianAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"today" | "week" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // ── Modal states ────────────────────────────────────────────────────────────
  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });
  const [newApptModal, setNewApptModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    appointmentId: number | null;
  }>({ open: false, appointmentId: null });
  const [rescheduleDate, setRescheduleDate] = useState("");

  // "new" = create patient + appointment, "existing" = search existing patient
  const [bookingTab, setBookingTab] = useState<"new" | "existing">("new");

  // ── New patient form state ──────────────────────────────────────────────────
  const [newApptForm, setNewApptForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex: "male",
    contact_info: "",
    appointment_date: "",
    reason_for_visit: "",
    notes: "",
    is_walkin: false,
  });

  // ── Existing patient search state ───────────────────────────────────────────
  // existingPatientSearch  : what the user is typing in the search box
  // existingPatientResults : dropdown list returned from the backend
  // selectedExistingPatient: the patient object the user clicked on
  // existingApptForm       : date/reason/notes for the new appointment
  const [existingPatientSearch, setExistingPatientSearch] = useState("");
  const [existingPatientResults, setExistingPatientResults] = useState<
    PatientResult[]
  >([]);
  const [selectedExistingPatient, setSelectedExistingPatient] =
    useState<PatientResult | null>(null);
  const [existingApptForm, setExistingApptForm] = useState({
    appointment_date: "",
    reason_for_visit: "",
    notes: "",
  });

  // ── Load appointments whenever filter changes ───────────────────────────────
  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/clinicians/appointments?filter=${filter}`, // wrapped ${}
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAppointments(data || []);
    } catch (error) {
      console.error("Appointments fetch error:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Stats derived from appointments array ───────────────────────────────────
  const stats = {
    total: appointments.length,
    booked: appointments.filter((a) => a.status === "booked").length,
    checkedIn: appointments.filter((a) => a.status === "checked_in").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    overdue: appointments.filter((a) => isOverdue(a.appointment_time, a.status))
      .length,
  };

  // ── Client-side name/ID search filter ──────────────────────────────────────
  const filteredAppointments = appointments
    .filter((a) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.patient_name?.toLowerCase().includes(q) ||
        a.pid?.toString().includes(q)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.appointment_time).getTime() -
        new Date(b.appointment_time).getTime()
    );

  // ── POST /api/clinician/appointments/new-patient ────────────────────────────
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/clinicians/appointments/new-patient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newApptForm),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setNewApptModal(false);
        resetNewApptForm();
        fetchAppointments();
        alert("Appointment booked successfully!");
      } else {
        alert(data.error || "Booking failed");
      }
    } catch (error: any) {
      alert("Network error: " + error.message);
    }
  };

  // ── POST /api/clinician/appointments/existing-patient ──────────────────────
  const handleCreateExistingAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: patient must be selected from the dropdown first
    if (!selectedExistingPatient) {
      alert("Please select a patient first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/clinicians/appointments/existing-patient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // patient_id comes from the selected patient object
          // appointment_date, reason_for_visit, notes come from existingApptForm
          body: JSON.stringify({
            patient_id: selectedExistingPatient.patient_id,
            ...existingApptForm,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setNewApptModal(false);
        resetExistingApptForm();
        fetchAppointments();
        alert("Appointment booked successfully!");
      } else {
        alert(data.error || "Booking failed");
      }
    } catch (error: any) {
      alert("Network error: " + error.message);
    }
  };

  // ── GET /api/clinicians/patients/search?q= ─────────────────────────────────
  // Only fires when query is at least 2 characters to avoid hammering the DB
  const handleExistingPatientSearch = async (query: string) => {
    setExistingPatientSearch(query);

    if (query.length < 2) {
      setExistingPatientResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/clinicians/patients/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setExistingPatientResults(data.patients || []);
      }
    } catch (error) {
      console.error("Patient search error:", error);
    }
  };

  // ── PATCH /api/clinician/appointments/:id/status ────────────────────────────
  const updateAppointmentStatus = async (
    appointment_id: number,
    status: "booked" | "checked_in" | "completed" | "cancelled" | "no_show"
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/clinicians/appointments/${appointment_id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update");
      }
      await fetchAppointments();
    } catch (error: any) {
      alert("Status update failed: " + error.message);
    }
  };

  // ── PATCH /api/clinician/appointments/:id/reschedule ───────────────────────
  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleModal.appointmentId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/clinicians/appointments/${
          rescheduleModal.appointmentId
        }/reschedule`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ appointment_date: rescheduleDate }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setRescheduleModal({ open: false, appointmentId: null });
        setRescheduleDate("");
        fetchAppointments();
        alert("Appointment rescheduled successfully!");
      } else {
        alert(data.error || "Reschedule failed");
      }
    } catch (error: any) {
      alert("Network error: " + error.message);
    }
  };

  // ── Form reset helpers ──────────────────────────────────────────────────────
  const resetNewApptForm = () =>
    setNewApptForm({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      sex: "male",
      contact_info: "",
      appointment_date: "",
      reason_for_visit: "",
      notes: "",
      is_walkin: false,
    });

  const resetExistingApptForm = () => {
    setSelectedExistingPatient(null);
    setExistingPatientSearch("");
    setExistingPatientResults([]);
    setExistingApptForm({
      appointment_date: "",
      reason_for_visit: "",
      notes: "",
    });
  };

  // Minimum selectable datetime = right now (prevents past bookings on frontend too)
  const minDateTime = new Date().toISOString().slice(0, 16);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#64748b",
          fontSize: "1.2rem",
        }}
      >
        Loading appointments...
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={s.gradientTitle}>Appointment Management</h1>
        <p style={s.subtitleStyle}>
          Manage today's patients and appointment queue
        </p>
      </div>

      {/* ── Stats Banner ────────────────────────────────────────────────── */}
      <div style={s.statsBanner}>
        <div style={s.statItem}>
          <span style={s.statNumber}>{stats.total}</span>{" "}
          <span style={s.statLabel}>Total</span>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <span style={s.statNumber}>{stats.booked}</span>{" "}
          <span style={s.statLabel}>Pending</span>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <span style={s.statNumber}>{stats.checkedIn}</span>
          <span style={s.statLabel}>Checked In</span>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <span style={s.statNumber}>{stats.completed}</span>
          <span style={s.statLabel}>Completed</span>
        </div>
        {stats.overdue > 0 && (
          <>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <span style={s.statNumber}>{stats.overdue}</span>
              <span style={s.statLabel}>⚠ Overdue</span>
            </div>
          </>
        )}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div style={s.controlPanel}>
        <div>
          <p style={s.controlLabel}>Filter by Date</p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap" as const,
            }}
          >
            {(["today", "week", "all"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                style={{
                  ...s.filterBtn,
                  ...(filter === period ? s.activeFilterBtn : {}),
                }}
              >
                {period === "today"
                  ? "Today"
                  : period === "week"
                  ? "This Week"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: "relative" as const }}>
          <p style={s.controlLabel}>Search Patient</p>
          <Search size={18} style={s.searchIconStyle} />
          <input
            type="text"
            placeholder="Name or Patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={s.searchInput}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" as const }}>
          <button style={s.bookBtn} onClick={() => setNewApptModal(true)}>
            <Plus size={18} /> Book Appointment
          </button>
        </div>
      </div>

      {/* ── Appointment List ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column" as const,
          gap: "1.25rem",
        }}
      >
        {filteredAppointments.length === 0 ? (
          <EmptyState filter={filter} onNew={() => setNewApptModal(true)} />
        ) : (
          filteredAppointments.map((appointment, index) => (
            <AppointmentCard
              key={appointment.appointment_id}
              appointment={appointment}
              queueNumber={index + 1}
              onUpdateStatus={updateAppointmentStatus}
              onReschedule={(id) =>
                setRescheduleModal({ open: true, appointmentId: id })
              }
              onViewProfile={async (pid) => {
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(
                    `${
                      import.meta.env.VITE_API_URL
                    }/clinicians/patients/${pid}/ai-profile`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const profile = await res.json();
                  setProfileModal({ open: true, data: profile });
                } catch (error: any) {
                  alert("AI Profile failed: " + error.message);
                }
              }}
            />
          ))
        )}
      </div>

      {/* ── AI Profile Modal ─────────────────────────────────────────────── */}
      {profileModal.open && profileModal.data && (
        <div
          style={s.modalOverlay}
          onClick={() => setProfileModal({ open: false, data: null })}
        >
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>AI Patient Profile</h2>
              <button
                style={s.closeBtn}
                onClick={() => setProfileModal({ open: false, data: null })}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: "1rem",
              }}
            >
              <ProfileSection
                color="#f0f9ff"
                border="#bae6fd"
                title="Patient Overview"
                titleColor="#0369a1"
              >
                <p style={s.profileText}>
                  <b>Name:</b> {profileModal.data.full_name}
                </p>
                <p style={s.profileText}>
                  <b>Age:</b> {profileModal.data.demographics?.age ?? "N/A"}
                </p>
                <p style={s.profileText}>
                  <b>Gender:</b>{" "}
                  {profileModal.data.demographics?.gender ?? "N/A"}
                </p>
                <p style={s.profileText}>
                  <b>Contact:</b>{" "}
                  {profileModal.data.demographics?.contact ?? "N/A"}
                </p>
              </ProfileSection>
              <ProfileSection
                color="#eff6ff"
                border="#dbeafe"
                title="Current Case Snapshot"
                titleColor="#1d4ed8"
              >
                <p style={s.profileText}>
                  <b>Chief complaint:</b>{" "}
                  {profileModal.data.current_case?.chief_complaint ?? "N/A"}
                </p>
                <p style={s.profileText}>
                  <b>Lesion location:</b>{" "}
                  {profileModal.data.current_case?.lesion_location ?? "N/A"}
                </p>
                <p style={s.profileText}>
                  <b>Status:</b>{" "}
                  {profileModal.data.current_case?.status ?? "N/A"}
                </p>
              </ProfileSection>
              <ProfileSection
                color="#f0fdf4"
                border="#bbf7d0"
                title="Medical History"
                titleColor="#15803d"
              >
                <p style={s.profileText}>
                  <b>Conditions:</b>{" "}
                  {profileModal.data.medical_history?.conditions ?? "N/A"}
                </p>
                <p style={s.profileText}>
                  <b>Medications:</b>{" "}
                  {profileModal.data.medical_history?.medications ?? "N/A"}
                </p>
              </ProfileSection>
              <ProfileSection
                color="#fff7ed"
                border="#fed7aa"
                title="AI Clinical Assessment"
                titleColor="#9a3412"
              >
                <div
                  style={{
                    whiteSpace: "pre-wrap" as const,
                    fontSize: "0.9rem",
                    color: "#7c2d12",
                  }}
                >
                  {profileModal.data.ai_clinical_assessment}
                </div>
              </ProfileSection>
            </div>
            <button
              style={{ ...s.primaryBtn, marginTop: "1.5rem" }}
              onClick={() => setProfileModal({ open: false, data: null })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Book Appointment Modal ───────────────────────────────────────── */}
      {newApptModal && (
        <div
          style={s.modalOverlay}
          onClick={() => {
            setNewApptModal(false);
            resetExistingApptForm();
          }}
        >
          <div
            style={{ ...s.modalBox, maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Book New Appointment</h2>
              <button
                style={s.closeBtn}
                onClick={() => {
                  setNewApptModal(false);
                  resetExistingApptForm();
                }}
              >
                ×
              </button>
            </div>

            {/* ── Tab switcher ─────────────────────────────────────────────── */}
            <div style={s.tabRow}>
              <button
                style={{
                  ...s.tabBtn,
                  ...(bookingTab === "new" ? s.activeTabBtn : {}),
                }}
                onClick={() => setBookingTab("new")}
              >
                New Patient
              </button>
              <button
                style={{
                  ...s.tabBtn,
                  ...(bookingTab === "existing" ? s.activeTabBtn : {}),
                }}
                onClick={() => setBookingTab("existing")}
              >
                Existing Patient
              </button>
            </div>

            {/* ── New Patient Form ─────────────────────────────────────────── */}
            {bookingTab === "new" && (
              <form onSubmit={handleCreateAppointment}>
                <div style={s.formRow}>
                  <FormField label="First Name *">
                    <input
                      required
                      style={s.inputStyle}
                      value={newApptForm.first_name}
                      onChange={(e) =>
                        setNewApptForm({
                          ...newApptForm,
                          first_name: e.target.value,
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Last Name *">
                    <input
                      required
                      style={s.inputStyle}
                      value={newApptForm.last_name}
                      onChange={(e) =>
                        setNewApptForm({
                          ...newApptForm,
                          last_name: e.target.value,
                        })
                      }
                    />
                  </FormField>
                </div>
                <div style={s.formRow}>
                  <FormField label="Date of Birth">
                    <input
                      type="date"
                      style={s.inputStyle}
                      value={newApptForm.date_of_birth}
                      onChange={(e) =>
                        setNewApptForm({
                          ...newApptForm,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Sex">
                    <select
                      style={s.inputStyle}
                      value={newApptForm.sex}
                      onChange={(e) =>
                        setNewApptForm({ ...newApptForm, sex: e.target.value })
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </FormField>
                </div>
                <FormField label="Contact Info *">
                  <input
                    required
                    style={s.inputStyle}
                    placeholder="Phone or email"
                    value={newApptForm.contact_info}
                    onChange={(e) =>
                      setNewApptForm({
                        ...newApptForm,
                        contact_info: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Appointment Date & Time *">
                  <input
                    required
                    type="datetime-local"
                    style={s.inputStyle}
                    min={minDateTime}
                    value={newApptForm.appointment_date}
                    onChange={(e) =>
                      setNewApptForm({
                        ...newApptForm,
                        appointment_date: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Reason for Visit">
                  <input
                    style={s.inputStyle}
                    placeholder="e.g. Skin rash, follow-up, acne consult"
                    value={newApptForm.reason_for_visit}
                    onChange={(e) =>
                      setNewApptForm({
                        ...newApptForm,
                        reason_for_visit: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Notes (optional)">
                  <textarea
                    rows={3}
                    style={{
                      ...s.inputStyle,
                      resize: "vertical" as const,
                      fontFamily: "inherit",
                    }}
                    value={newApptForm.notes}
                    onChange={(e) =>
                      setNewApptForm({ ...newApptForm, notes: e.target.value })
                    }
                  />
                </FormField>
                <div style={s.formRow}>
                  <button
                    type="button"
                    style={s.secondaryBtn}
                    onClick={() => setNewApptModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={s.primaryBtn}>
                    Book Appointment
                  </button>
                </div>
              </form>
            )}

            {/* ── Existing Patient Form ────────────────────────────────────── */}
            {bookingTab === "existing" && (
              <form onSubmit={handleCreateExistingAppointment}>
                {/* Search field with dropdown */}
                <FormField label="Search Patient *">
                  {/*
                    CRITICAL: position:relative + zIndex on this wrapper
                    so the absolute dropdown renders on top of the modal,
                    not clipped behind it
                  */}
                  <div style={{ position: "relative", zIndex: 100 }}>
                    <Search
                      size={16}
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                      }}
                    />
                    <input
                      style={{ ...s.inputStyle, paddingLeft: "2.5rem" }}
                      placeholder="Search by name or phone..."
                      value={existingPatientSearch}
                      onChange={(e) =>
                        handleExistingPatientSearch(e.target.value)
                      }
                      // Clear selection if user starts typing again
                      onFocus={() => {
                        if (selectedExistingPatient) {
                          setSelectedExistingPatient(null);
                          setExistingPatientSearch("");
                        }
                      }}
                    />

                    {/* Dropdown — MUST be inside the relative wrapper for z-index to work */}
                    {existingPatientResults.length > 0 && (
                      <div style={s.dropdownStyle}>
                        {existingPatientResults.map((p) => (
                          <div
                            key={p.patient_id}
                            style={s.dropdownItem}
                            // onMouseDown instead of onClick prevents the input blur
                            // from firing before the click registers
                            onMouseDown={() => {
                              setSelectedExistingPatient(p);
                              // Use full_name — this is what the backend returns
                              setExistingPatientSearch(p.full_name);
                              setExistingPatientResults([]);
                            }}
                          >
                            {/* full_name = CONCAT(first_name, ' ', last_name) from backend */}
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {p.full_name}
                            </div>
                            {/* contact_info = phone number from patients table */}
                            <div
                              style={{ fontSize: "0.8rem", color: "#6b7280" }}
                            >
                              ID: {p.patient_id} ·{" "}
                              {p.contact_info || "No phone"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>

                {/* Show confirmation badge once a patient is selected */}
                {selectedExistingPatient && (
                  <div style={s.selectedPatientBadge}>
                    <CheckCircle size={16} style={{ color: "#10b981" }} />
                    {/* Use full_name — NOT name (name is undefined) */}
                    <span>
                      <b>{selectedExistingPatient.full_name}</b> · ID:{" "}
                      {selectedExistingPatient.patient_id}
                    </span>
                  </div>
                )}

                <FormField label="Appointment Date & Time *">
                  <input
                    required
                    type="datetime-local"
                    style={s.inputStyle}
                    min={minDateTime}
                    value={existingApptForm.appointment_date}
                    onChange={(e) =>
                      setExistingApptForm({
                        ...existingApptForm,
                        appointment_date: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Reason for Visit">
                  <input
                    style={s.inputStyle}
                    placeholder="e.g. Follow-up, new complaint"
                    value={existingApptForm.reason_for_visit}
                    onChange={(e) =>
                      setExistingApptForm({
                        ...existingApptForm,
                        reason_for_visit: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Notes (optional)">
                  <textarea
                    rows={3}
                    style={{
                      ...s.inputStyle,
                      resize: "vertical" as const,
                      fontFamily: "inherit",
                    }}
                    value={existingApptForm.notes}
                    onChange={(e) =>
                      setExistingApptForm({
                        ...existingApptForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </FormField>
                <div style={s.formRow}>
                  <button
                    type="button"
                    style={s.secondaryBtn}
                    onClick={() => {
                      setNewApptModal(false);
                      resetExistingApptForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={s.primaryBtn}>
                    Book Appointment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ─────────────────────────────────────────────── */}
      {rescheduleModal.open && (
        <div
          style={s.modalOverlay}
          onClick={() =>
            setRescheduleModal({ open: false, appointmentId: null })
          }
        >
          <div
            style={{ ...s.modalBox, maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Reschedule Appointment</h2>
              <button
                style={s.closeBtn}
                onClick={() =>
                  setRescheduleModal({ open: false, appointmentId: null })
                }
              >
                ×
              </button>
            </div>
            <FormField label="New Date & Time *">
              <input
                type="datetime-local"
                style={s.inputStyle}
                min={minDateTime}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </FormField>
            <div style={{ ...s.formRow, marginTop: "1.5rem" }}>
              <button
                style={s.secondaryBtn}
                onClick={() =>
                  setRescheduleModal({ open: false, appointmentId: null })
                }
              >
                Cancel
              </button>
              <button style={s.primaryBtn} onClick={handleReschedule}>
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({
  appointment,
  queueNumber,
  onUpdateStatus,
  onReschedule,
  onViewProfile,
}: {
  appointment: Appointment;
  queueNumber: number;
  onUpdateStatus: (id: number, status: any) => Promise<void>;
  onReschedule: (id: number) => void;
  onViewProfile: (pid: number) => void;
}) {
  const navigate = useNavigate();
  const overdue = isOverdue(appointment.appointment_time, appointment.status);
  const statusConfig = getStatusConfig(appointment.status);
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";
  const isCheckedIn = appointment.status === "checked_in";
  const isBooked = appointment.status === "booked";

  return (
    <div
      style={{
        ...s.appointmentCard,
        borderLeft: `5px solid ${statusConfig.border}`,
        opacity: isCompleted || isCancelled ? 0.75 : 1,
      }}
    >
      <div style={s.cardGrid}>
        {/* ── Queue + Time ─────────────────────────────────────────────── */}
        <div style={{ textAlign: "center" as const, minWidth: "70px" }}>
          <div style={s.queueBadge}>#{queueNumber}</div>
          <div
            style={{
              ...s.timeBlock,
              backgroundColor: overdue ? "#ef4444" : "#3db5e6",
            }}
          >
            <div style={s.timeHour}>
              {formatTime(appointment.appointment_time).split(":")[0]}
            </div>
            <div style={s.timeMin}>
              {" "}
              {formatTime(appointment.appointment_time).split(":")[1]}
            </div>
          </div>
          <div style={s.dateText}>
            {formatDate(appointment.appointment_time)}
          </div>
          {overdue && (
            <div style={s.overdueBadge}>
              <AlertCircle size={12} /> LATE
            </div>
          )}
        </div>

        {/* ── Patient Info ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: "0.4rem",
          }}
        >
          <div style={s.patientNameStyle}>{appointment.patient_name}</div>
          <div
            style={{ color: "#3db5e6", fontWeight: 600, fontSize: "0.9rem" }}
          >
            PID: {appointment.pid}
          </div>
          <div style={s.patientMeta}>
            <User size={14} /> {appointment.phone || "N/A"}
          </div>
          {appointment.reason_for_visit && (
            <div style={s.reasonBadge}>📋 {appointment.reason_for_visit}</div>
          )}
          {appointment.notes && (
            <div style={s.notesText}>{appointment.notes}</div>
          )}
        </div>

        {/* ── AI Summary ───────────────────────────────────────────────── */}
        <div style={s.aiSummaryBox}>
          <div style={s.aiSummaryTitle}>AI Summary</div>
          <div style={s.aiSummaryText}>{appointment.ai_summary}</div>
        </div>

        {/* ── Status Badge ─────────────────────────────────────────────── */}
        <div style={{ textAlign: "center" as const }}>
          <div style={{ ...s.statusBadge, backgroundColor: statusConfig.bg }}>
            {statusConfig.label}
          </div>
          {appointment.checked_in_at && (
            <div style={s.timestampText}>
              In: {formatTime(appointment.checked_in_at)}
            </div>
          )}
          {appointment.completed_at && (
            <div style={s.timestampText}>
              Done: {formatTime(appointment.completed_at)}
            </div>
          )}
        </div>

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <div style={s.actionsCol}>
          {isBooked && (
            <button
              style={s.actionBtnGreen}
              onClick={() =>
                onUpdateStatus(appointment.appointment_id, "checked_in")
              }
            >
              <CheckCircle size={14} /> Check In
            </button>
          )}
          {!isCompleted && !isCancelled && (
            <button
              style={s.actionBtnPurple}
              onClick={
                () =>
                  navigate(
                    `/clinician/create-case?patient_id=${appointment.pid}&appointment_id=${appointment.appointment_id}`
                  ) /////////////////////////////////////////////////////////////////////
              }
            >
              ➕ Create Case
            </button>
          )}
          <button
            style={s.actionBtnBlue}
            onClick={() => onViewProfile(appointment.pid)}
          >
            👤 AI Profile
          </button>
          {isBooked && (
            <button
              style={s.actionBtnYellow}
              onClick={() => onReschedule(appointment.appointment_id)}
            >
              <RefreshCw size={14} /> Reschedule
            </button>
          )}
          {isCheckedIn && (
            <button
              style={s.actionBtnGray}
              onClick={() =>
                onUpdateStatus(appointment.appointment_id, "completed")
              }
            >
              <CheckCircle size={14} /> Complete
            </button>
          )}
          {isBooked && (
            <button
              style={s.actionBtnRed}
              onClick={() => {
                if (window.confirm("Cancel this appointment?"))
                  onUpdateStatus(appointment.appointment_id, "cancelled");
              }}
            >
              <XCircle size={14} /> Cancel
            </button>
          )}
          {isBooked && (
            <button
              style={s.actionBtnMuted}
              onClick={() =>
                onUpdateStatus(appointment.appointment_id, "no_show")
              }
            >
              <Clock size={14} /> No Show
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable components
function ProfileSection({ color, border, title, titleColor, children }: any) {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderRadius: "12px",
        backgroundColor: color,
        border: `1px solid ${border}`,
      }}
    >
      <h3
        style={{
          margin: "0 0 0.5rem 0",
          fontSize: "1rem",
          fontWeight: 600,
          color: titleColor,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={s.labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ filter, onNew }: { filter: string; onNew: () => void }) {
  const messages: Record<string, string> = {
    today: "No appointments scheduled for today.",
    week: "No appointments this week.",
    all: "No appointments found.",
  };
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "20px",
        padding: "4rem 2rem",
        textAlign: "center" as const,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
      }}
    >
      <Calendar
        size={56}
        style={{ color: "#3db5e6", opacity: 0.4, marginBottom: "1rem" }}
      />
      <h3
        style={{ fontSize: "1.4rem", color: "#1e293b", marginBottom: "0.5rem" }}
      >
        {messages[filter]}
      </h3>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Book a new appointment to get started.
      </p>
      <button style={s.primaryBtn} onClick={onNew}>
        <Plus size={16} /> Book Appointment
      </button>
    </div>
  );
}

// ─── Styles
const s: Record<string, React.CSSProperties> = {
  gradientTitle: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: 0,
    background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitleStyle: { color: "#64748b", fontSize: "1rem", marginTop: "0.4rem" },
  statsBanner: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "1.25rem 2rem",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    flexWrap: "wrap",
    gap: "0",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 2rem",
  },
  statNumber: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1,
  },
  statLabel: { fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" },
  statDivider: { width: "1px", height: "40px", backgroundColor: "#e5e7eb" },
  controlPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 220px",
    gap: "1.5rem",
    backgroundColor: "#fff",
    padding: "1.5rem 2rem",
    borderRadius: "16px",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    alignItems: "start",
  },
  controlLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.6rem",
    marginTop: 0,
  },
  filterBtn: {
    padding: "0.6rem 1.25rem",
    border: "2px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  activeFilterBtn: {
    backgroundColor: "#3db5e6",
    color: "#fff",
    borderColor: "#3db5e6",
  },
  searchIconStyle: {
    position: "absolute",
    left: "0.9rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  bookBtn: {
    width: "100%",
    padding: "0.85rem 1.5rem",
    background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "1.75rem 2rem",
    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
    border: "1px solid #e5e7eb",
    transition: "all 0.2s",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 220px 150px 200px",
    gap: "1.5rem",
    alignItems: "start",
  },
  queueBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: "0.4rem",
    textAlign: "center",
  },
  timeBlock: {
    width: "58px",
    height: "58px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    margin: "0 auto",
  },
  timeHour: { fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 },
  timeMin: { fontSize: "0.8rem", fontWeight: 500 },
  dateText: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "0.4rem",
    textAlign: "center",
  },
  overdueBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "6px",
    marginTop: "0.4rem",
  },
  patientNameStyle: { fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" },
  patientMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    color: "#64748b",
    fontSize: "0.9rem",
  },
  reasonBadge: {
    display: "inline-block",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "0.8rem",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontWeight: 500,
  },
  notesText: { fontSize: "0.82rem", color: "#9ca3af", fontStyle: "italic" },
  aiSummaryBox: {
    backgroundColor: "#fffbeb",
    borderLeft: "4px solid #f59e0b",
    borderRadius: "10px",
    padding: "0.85rem 1rem",
  },
  aiSummaryTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#92400e",
    marginBottom: "0.3rem",
  },
  aiSummaryText: { fontSize: "0.88rem", color: "#78350f" },
  statusBadge: {
    display: "inline-block",
    padding: "0.4rem 1rem",
    borderRadius: "20px",
    fontWeight: 700,
    fontSize: "0.75rem",
    color: "#fff",
  },
  timestampText: { fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.3rem" },
  actionsCol: { display: "flex", flexDirection: "column", gap: "0.5rem" },

  //
  actionBtnGreen: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },
  actionBtnPurple: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#8b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },
  actionBtnBlue: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#3db5e6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },
  actionBtnYellow: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },
  actionBtnGray: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#6b7280",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },
  actionBtnRed: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },
  actionBtnMuted: {
    padding: "0.55rem 0.85rem",
    backgroundColor: "#9ca3af",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  },

  // Modals
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "1rem",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "2rem",
    maxWidth: "700px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  closeBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // tabBtn uses borderBottomWidth + borderBottomStyle + borderBottomColor
  // separately instead of mixing `borderBottom` shorthand with `borderBottomColor`
  // — this eliminates the React style warning completely
  tabRow: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "0",
  },
  tabBtn: {
    padding: "0.75rem 1.5rem",
    border: "none",
    background: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "#6b7280",
    cursor: "pointer",
    borderBottomWidth: "3px",
    borderBottomStyle: "solid",
    borderBottomColor: "transparent",
    marginBottom: "-2px",
  },
  activeTabBtn: { color: "#3db5e6", borderBottomColor: "#3db5e6" },

  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  labelStyle: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.4rem",
  },
  inputStyle: {
    width: "100%",
    padding: "0.85rem 1rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },

  // zIndex raised to 9999 so dropdown renders above modal overlay
  dropdownStyle: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 9999,
    maxHeight: "220px",
    overflowY: "auto",
    marginTop: "4px",
  },

  //  uses only borderBottom shorthand — no borderBottomColor conflict
  dropdownItem: {
    padding: "0.75rem 1rem",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
  },
  selectedPatientBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1.25rem",
    fontSize: "0.9rem",
    color: "#166534",
  },
  primaryBtn: {
    flex: 1,
    padding: "0.9rem 1.5rem",
    backgroundColor: "#3db5e6",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  secondaryBtn: {
    flex: 1,
    padding: "0.9rem 1.5rem",
    backgroundColor: "transparent",
    color: "#374151",
    border: "2px solid #d1d5db",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  profileText: { margin: "0.2rem 0", fontSize: "0.9rem" },
};
