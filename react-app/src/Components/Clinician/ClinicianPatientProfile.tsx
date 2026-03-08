// src/Components/Clinician/ClinicianPatientProfile.tsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  FileText,
  Activity,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  CreditCard,
  Printer,
  Stethoscope,
  Eye,
} from "lucide-react";

const API = "http://localhost:5001/api";
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  contact_info: string | null;
  date_of_birth: string | null;
  sex: string | null;
  occupation: string | null;
  is_walkin: number;
  created_at: string;
}

interface PatientCase {
  case_id: number;
  created_at: string;
  status: string;
  chief_complaint: string | null;
  bp: string | null;
  temp: string | null;
  weight: string | null;
  image_count: number;
}

interface VitalsForm {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
  height: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Draft",
    color: "#64748b",
    bg: "#f1f5f9",
    icon: <Clock size={12} />,
  },
  sent_to_derm: {
    label: "Sent to Derm",
    color: "#d97706",
    bg: "#fef3c7",
    icon: <Send size={12} />,
  },
  treatment_ready: {
    label: "Treatment Ready",
    color: "#059669",
    bg: "#d1fae5",
    icon: <CheckCircle size={12} />,
  },
  completed: {
    label: "Completed",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: <CheckCircle size={12} />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (first: string, last: string) =>
  ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase();

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const calcAge = (dob: string | null) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
};

const AVATAR_COLORS = [
  { bg: "#e0f2fe", color: "#0369a1" },
  { bg: "#d1fae5", color: "#065f46" },
  { bg: "#ede9fe", color: "#5b21b6" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#fef3c7", color: "#92400e" },
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClinicianPatientProfile() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const numericPatientId = useMemo(() => Number(patientId), [patientId]);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(false);
  const [error, setError] = useState("");
  const [casesError, setCasesError] = useState("");

  // Vitals modal
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<VitalsForm>({
    bp: "",
    pulse: "",
    temp: "",
    weight: "",
    height: "",
  });
  const [vitalsSaving, setVitalsSaving] = useState(false);
  const [vitalsError, setVitalsError] = useState("");
  const [vitalsSaved, setVitalsSaved] = useState(false);

  // ── Fetch patient ────────────────────────────────────────────────────────
  const fetchPatient = useCallback(async () => {
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      setError("Invalid patient ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/clinicians/patients/${numericPatientId}`,
        { headers: auth() }
      );
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatient(data.patient);
    } catch (e: any) {
      setError(e.message || "Failed to load patient");
    } finally {
      setLoading(false);
    }
  }, [numericPatientId]);

  // ── Fetch case history ───────────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) return;
    setCasesLoading(true);
    setCasesError("");
    try {
      const res = await fetch(
        `${API}/clinicians/patients/${numericPatientId}/cases`,
        { headers: auth() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCases(data.cases || []);
    } catch (e: any) {
      setCasesError(e.message || "Failed to load case history");
    } finally {
      setCasesLoading(false);
    }
  }, [numericPatientId]);

  useEffect(() => {
    fetchPatient();
    fetchCases();
  }, [fetchPatient, fetchCases]);

  // ── Save vitals ──────────────────────────────────────────────────────────
  const handleSaveVitals = async () => {
    if (!patient) return;
    setVitalsSaving(true);
    setVitalsError("");
    try {
      const res = await fetch(
        `${API}/clinicians/patients/${patient.patient_id}/vitals`,
        {
          method: "PUT",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({ vitals: vitalsForm }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update vitals");
      }
      setVitalsSaved(true);
      setTimeout(() => {
        setVitalsOpen(false);
        setVitalsSaved(false);
        fetchCases();
      }, 1200);
    } catch (e: any) {
      setVitalsError(e.message);
    } finally {
      setVitalsSaving(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <div style={{ color: "#64748b", marginTop: "1rem" }}>
          Loading patient profile...
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={s.page}>
        <div style={s.errorBanner}>
          <AlertCircle size={15} />
          <span style={{ flex: 1 }}>{error || "Patient not found"}</span>
          <button style={s.retryBtn} onClick={fetchPatient}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const ac = avatarColor(patient.patient_id);
  const age = calcAge(patient.date_of_birth);
  const latestCase = cases[0] || null;
  const totalCases = cases.length;
  const lastVisit = latestCase
    ? formatDate(latestCase.created_at)
    : "No visits yet";

  return (
    <>
      <div style={s.page}>
        {/* ── Back + actions header ── */}
        <div style={s.pageHeader}>
          <button
            style={s.backBtn}
            onClick={() => navigate("/clinician/patients")}
          >
            <ArrowLeft size={15} />
            Back to Patients
          </button>
          <div style={s.headerActions}>
            <button style={s.outlineBtn} onClick={() => window.print()}>
              <Printer size={14} />
              Print
            </button>
            <button style={s.outlineBtn} onClick={() => setVitalsOpen(true)}>
              <Activity size={14} />
              Update Vitals
            </button>
            <button
              style={s.primaryBtn}
              onClick={() =>
                navigate(
                  `/clinician/create-case?patient_id=${patient.patient_id}`
                )
              }
            >
              <Plus size={15} />
              New Case
            </button>
          </div>
        </div>

        {/* ── Patient identity card ── */}
        <div style={s.identityCard}>
          <div style={s.identityLeft}>
            <div
              style={{
                ...s.avatar,
                backgroundColor: ac.bg,
                color: ac.color,
              }}
            >
              {getInitials(patient.first_name, patient.last_name)}
            </div>
            <div>
              <h1 style={s.patientName}>
                {patient.first_name} {patient.last_name}
              </h1>
              <div style={s.pidTag}>
                PID-{String(patient.patient_id).padStart(6, "0")}
              </div>
              <div style={s.tagRow}>
                {patient.is_walkin ? (
                  <span style={s.walkinTag}>Walk-in</span>
                ) : (
                  <span style={s.apptTag}>Appointment</span>
                )}
                {age !== null && <span style={s.ageTag}>{age} years old</span>}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={s.identityStats}>
            <div style={s.quickStat}>
              <Calendar size={16} style={{ color: "#94a3b8" }} />
              <div>
                <div style={s.quickStatLabel}>Last Visit</div>
                <div style={s.quickStatValue}>{lastVisit}</div>
              </div>
            </div>
            <div style={s.statDivider} />
            <div style={s.quickStat}>
              <FileText size={16} style={{ color: "#94a3b8" }} />
              <div>
                <div style={s.quickStatLabel}>Total Cases</div>
                <div style={s.quickStatValue}>{totalCases}</div>
              </div>
            </div>
            <div style={s.statDivider} />
            <div style={s.quickStat}>
              <Stethoscope size={16} style={{ color: "#94a3b8" }} />
              <div>
                <div style={s.quickStatLabel}>Registered</div>
                <div style={s.quickStatValue}>
                  {formatDate(patient.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Demographics + Latest vitals ── */}
        <div style={s.twoCol}>
          {/* Demographics */}
          <div style={s.card}>
            <SectionHead
              icon={<User size={15} style={{ color: "#3db5e6" }} />}
              title="Demographics"
            />
            <div style={s.demoGrid}>
              <DemoItem
                label="Phone"
                value={
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Phone size={13} style={{ color: "#94a3b8" }} />
                    {patient.contact_info || "—"}
                  </span>
                }
              />
              <DemoItem
                label="Date of Birth"
                value={formatDate(patient.date_of_birth)}
              />
              <DemoItem
                label="Sex"
                value={
                  patient.sex
                    ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)
                    : "—"
                }
              />
              <DemoItem
                label="Age"
                value={age !== null ? `${age} years` : "—"}
              />
              <DemoItem label="Occupation" value={patient.occupation || "—"} />
              <DemoItem
                label="Patient Type"
                value={patient.is_walkin ? "Walk-in" : "Appointment"}
              />
            </div>
          </div>

          {/* Latest vitals */}
          <div style={s.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.1rem",
              }}
            >
              <SectionHead
                icon={<Activity size={15} style={{ color: "#ef4444" }} />}
                title="Latest Vitals"
                noMargin
              />
              <button style={s.smallBtn} onClick={() => setVitalsOpen(true)}>
                Update
              </button>
            </div>

            {latestCase &&
            (latestCase.bp || latestCase.temp || latestCase.weight) ? (
              <>
                <div style={s.vitalsGrid}>
                  <VitalCard
                    label="Blood Pressure"
                    value={latestCase.bp || "—"}
                    unit=""
                    accent="#ef4444"
                  />
                  <VitalCard
                    label="Temperature"
                    value={latestCase.temp || "—"}
                    unit=""
                    accent="#f59e0b"
                  />
                  <VitalCard
                    label="Weight"
                    value={latestCase.weight || "—"}
                    unit=""
                    accent="#059669"
                  />
                </div>
                <p style={s.vitalsSource}>
                  From Case #{latestCase.case_id} ·{" "}
                  {formatDateTime(latestCase.created_at)}
                </p>
              </>
            ) : (
              <div style={s.emptyVitals}>
                <Activity
                  size={28}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}
                >
                  No vitals recorded yet
                </p>
                <button
                  style={{ ...s.smallBtn, marginTop: "0.75rem" }}
                  onClick={() => setVitalsOpen(true)}
                >
                  Record Vitals
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Case history ── */}
        <div style={s.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <SectionHead
              icon={<FileText size={15} style={{ color: "#8b5cf6" }} />}
              title={`Case History (${totalCases})`}
              noMargin
            />
            <button
              style={s.primaryBtn}
              onClick={() =>
                navigate(
                  `/clinician/create-case?patient_id=${patient.patient_id}`
                )
              }
            >
              <Plus size={14} />
              New Case
            </button>
          </div>

          {casesLoading && (
            <div style={s.casesLoading}>
              <Activity size={20} style={{ color: "#3db5e6" }} />
              <span>Loading cases...</span>
            </div>
          )}

          {casesError && !casesLoading && (
            <div style={s.errorBanner}>
              <AlertCircle size={14} />
              <span>{casesError}</span>
            </div>
          )}

          {!casesLoading && !casesError && cases.length === 0 && (
            <div style={s.emptyCases}>
              <FileText
                size={36}
                style={{ color: "#d1d5db", marginBottom: "0.75rem" }}
              />
              <p
                style={{
                  fontWeight: 600,
                  color: "#374151",
                  margin: "0 0 0.4rem 0",
                }}
              >
                No cases yet
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  margin: "0 0 1rem 0",
                }}
              >
                Create the first case for this patient
              </p>
              <button
                style={s.primaryBtn}
                onClick={() =>
                  navigate(
                    `/clinician/create-case?patient_id=${patient.patient_id}`
                  )
                }
              >
                <Plus size={14} />
                Create Case
              </button>
            </div>
          )}

          {!casesLoading && cases.length > 0 && (
            <div style={s.casesList}>
              {cases.map((c, idx) => {
                const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
                return (
                  <div
                    key={c.case_id}
                    style={{
                      ...s.caseRow,
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafbfc",
                    }}
                  >
                    {/* Case ID + date */}
                    <div style={{ flex: "0 0 160px" }}>
                      <div style={s.caseId}>Case #{c.case_id}</div>
                      <div style={s.caseDate}>
                        {formatDateTime(c.created_at)}
                      </div>
                    </div>

                    {/* Chief complaint */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.caseComplaint}>
                        {c.chief_complaint || "No complaint recorded"}
                      </div>
                      {(c.bp || c.temp || c.weight) && (
                        <div style={s.caseVitalsRow}>
                          {c.bp && <span>BP: {c.bp}</span>}
                          {c.temp && <span>Temp: {c.temp}</span>}
                          {c.weight && <span>Wt: {c.weight}</span>}
                        </div>
                      )}
                    </div>

                    {/* Images count */}
                    <div
                      style={{ flex: "0 0 80px", textAlign: "center" as const }}
                    >
                      <span style={s.imageCount}>
                        {c.image_count} img{c.image_count !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div
                      style={{
                        flex: "0 0 140px",
                        textAlign: "center" as const,
                      }}
                    >
                      <span
                        style={{
                          ...s.statusBadge,
                          backgroundColor: sc.bg,
                          color: sc.color,
                        }}
                      >
                        {sc.icon}
                        {sc.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={s.caseActions}>
                      <button
                        style={s.caseActionBtn}
                        onClick={() =>
                          navigate(`/clinician/cases/${c.case_id}`)
                        }
                        title="View case"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      {c.status === "treatment_ready" && (
                        <button
                          style={s.casePayBtn}
                          onClick={() =>
                            navigate(
                              `/clinician/billing/new?case_id=${c.case_id}&patient_id=${patient.patient_id}`
                            )
                          }
                          title="Proceed to payment"
                        >
                          <CreditCard size={13} />
                          Pay
                        </button>
                      )}
                      <button
                        style={s.caseFollowBtn}
                        onClick={() =>
                          navigate(
                            `/clinician/create-case?patient_id=${patient.patient_id}&parent_case_id=${c.case_id}`
                          )
                        }
                        title="Follow-up on this case"
                      >
                        <Plus size={13} />
                        Follow-up
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Vitals modal ── */}
      {vitalsOpen && (
        <div
          style={s.modalOverlay}
          onClick={() => !vitalsSaving && setVitalsOpen(false)}
        >
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Update Vitals</h3>
            <p style={s.modalSub}>
              Saves to the most recent case for this patient.
            </p>

            <div style={s.vitalsFormGrid}>
              {(
                [
                  {
                    key: "bp",
                    label: "Blood Pressure",
                    placeholder: "120/80 mmHg",
                  },
                  { key: "pulse", label: "Pulse", placeholder: "72 bpm" },
                  { key: "temp", label: "Temperature", placeholder: "36.8 °C" },
                  { key: "weight", label: "Weight", placeholder: "70 kg" },
                  { key: "height", label: "Height", placeholder: "170 cm" },
                ] as {
                  key: keyof VitalsForm;
                  label: string;
                  placeholder: string;
                }[]
              ).map((field) => (
                <div key={field.key} style={s.formField}>
                  <label style={s.formLabel}>{field.label}</label>
                  <input
                    style={s.formInput}
                    value={vitalsForm[field.key]}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      setVitalsForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            {vitalsError && (
              <div style={s.modalError}>
                <AlertCircle size={14} />
                {vitalsError}
              </div>
            )}

            {vitalsSaved && (
              <div style={s.modalSuccess}>
                <CheckCircle size={14} />
                Vitals saved successfully
              </div>
            )}

            <div style={s.modalActions}>
              <button
                style={s.modalCancelBtn}
                onClick={() => !vitalsSaving && setVitalsOpen(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.modalSaveBtn,
                  opacity: vitalsSaving ? 0.7 : 1,
                  cursor: vitalsSaving ? "not-allowed" : "pointer",
                }}
                onClick={handleSaveVitals}
                disabled={vitalsSaving}
              >
                {vitalsSaving ? "Saving..." : "Save Vitals"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHead({
  icon,
  title,
  noMargin = false,
}: {
  icon: React.ReactNode;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: noMargin ? 0 : "1.1rem",
      }}
    >
      {icon}
      <h3
        style={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "#374151",
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
    </div>
  );
}

function DemoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={s.demoItem}>
      <span style={s.demoLabel}>{label}</span>
      <span style={s.demoValue}>{value}</span>
    </div>
  );
}

function VitalCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div style={{ ...s.vitalCard, borderTop: `3px solid ${accent}` }}>
      <div style={s.vitalLabel}>{label}</div>
      <div style={{ ...s.vitalValue, color: accent }}>{value}</div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "2rem 1.5rem",
    maxWidth: "1100px",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
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
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: 0,
  },
  headerActions: { display: "flex", gap: "0.75rem", alignItems: "center" },
  outlineBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.55rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.6rem 1.1rem",
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
  },
  smallBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.35rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    background: "#f8fafc",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.75rem",
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

  identityCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.75rem 2rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  identityLeft: { display: "flex", alignItems: "center", gap: "1.25rem" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1.3rem",
    flexShrink: 0,
  },
  patientName: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 0.3rem 0",
    lineHeight: 1.2,
  },
  pidTag: {
    display: "inline-block",
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: 600,
    marginBottom: "0.4rem",
  },
  tagRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  walkinTag: {
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  apptTag: {
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
  },
  ageTag: {
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },

  identityStats: { display: "flex", alignItems: "center", gap: "1.5rem" },
  quickStat: { display: "flex", alignItems: "flex-start", gap: "0.6rem" },
  quickStatLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  quickStatValue: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#111827",
    marginTop: "0.1rem",
  },
  statDivider: { width: 1, height: 36, backgroundColor: "#e5e7eb" },

  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },

  demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  demoItem: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  demoLabel: {
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  demoValue: { fontSize: "0.875rem", fontWeight: 500, color: "#111827" },

  vitalsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  vitalCard: {
    padding: "0.875rem",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  vitalLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "0.3rem",
  },
  vitalValue: { fontSize: "1.1rem", fontWeight: 800 },
  vitalsSource: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    margin: "0.75rem 0 0 0",
  },
  emptyVitals: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1.5rem 0",
    textAlign: "center",
  },

  casesList: {
    display: "flex",
    flexDirection: "column",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  caseRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid #f1f5f9",
  },
  caseId: { fontWeight: 700, fontSize: "0.875rem", color: "#111827" },
  caseDate: { fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.15rem" },
  caseComplaint: {
    fontSize: "0.875rem",
    color: "#374151",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  caseVitalsRow: {
    display: "flex",
    gap: "0.75rem",
    fontSize: "0.72rem",
    color: "#94a3b8",
    marginTop: "0.2rem",
  },
  imageCount: { fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
  },
  caseActions: {
    flex: "0 0 200px",
    display: "flex",
    gap: "0.4rem",
    justifyContent: "flex-end",
  },
  caseActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.35rem 0.65rem",
    borderRadius: "7px",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  casePayBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.35rem 0.65rem",
    borderRadius: "7px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  caseFollowBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.35rem 0.65rem",
    borderRadius: "7px",
    backgroundColor: "#ede9fe",
    color: "#5b21b6",
    border: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
  },

  casesLoading: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    fontSize: "0.875rem",
    padding: "1rem 0",
  },
  emptyCases: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 2rem",
    textAlign: "center",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "2rem",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
  },
  modalTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 0.25rem 0",
  },
  modalSub: { fontSize: "0.8rem", color: "#94a3b8", margin: "0 0 1.25rem 0" },
  vitalsFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1rem",
  },
  formField: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  formLabel: { fontSize: "0.78rem", fontWeight: 600, color: "#374151" },
  formInput: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#111827",
    backgroundColor: "#f8fafc",
    outline: "none",
  },
  modalError: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.6rem 0.875rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    marginBottom: "1rem",
  },
  modalSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "0.6rem 0.875rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    marginBottom: "1rem",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "0.75rem",
  },
  modalCancelBtn: {
    padding: "0.6rem 1.25rem",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  modalSaveBtn: {
    padding: "0.6rem 1.5rem",
    border: "none",
    borderRadius: "9px",
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.875rem",
  },
};
