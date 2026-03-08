// src/Components/Dermatologist/CaseWorkspacePage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Stethoscope,
  ImageIcon,
  Brain,
  FileText,
  Activity,
  Eye,
  X,
  CheckCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Send,
  Pill,
  Sparkles,
  RotateCcw,
  Heart,
  History,
  ClipboardList,
  ZoomIn,
  Shield,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}";
const BASE_URL = "import.meta.env.VITE_UPLOADS_URL";

const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

interface Vitals {
  bp?: string;
  temp?: string;
  weight?: string;
  height?: string;
  pulse?: string;
  [key: string]: string | undefined;
}
interface CaseDetail {
  case_id: number;
  patient_id: number;
  patient_name: string;
  patient_dob: string | null;
  patient_sex: string | null;
  patient_contact: string | null;
  patient_occupation: string | null;
  chief_complaint: string;
  lesion_duration: string | null;
  lesion_location: string | null;
  lesion_type: string | null;
  symptoms: string | null;
  prior_treatment: string | null;
  vitals_json: Vitals | string | null;
  status: string;
  image_count: number;
  clinician_name: string;
  clinician_email: string | null;
  created_at: string;
  parent_case_id: number | null;
}
interface CaseImage {
  id: number;
  file_path: string;
  created_at: string;
}
interface Allergy {
  allergy_name: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
}
interface Medication {
  medication_name: string;
  dosage: string;
  start_date: string;
}
interface Condition {
  condition_name: string;
  severity: string;
  notes: string | null;
  date_recorded: string;
}
interface PriorCase {
  case_id: number;
  chief_complaint: string;
  status: string;
  created_at: string;
  final_diagnosis: string | null;
  treatment: string | null;
}
interface AIPrediction {
  predicted_label: string;
  confidence_score: number;
  model_version: string;
  created_at: string;
}
interface Diagnosis {
  diagnosis_id: number;
  final_diagnosis: string;
  notes: string | null;
  dermatologist_name: string;
  approved_at: string;
}
interface Treatment {
  treatment_id: number;
  medications: string;
  lifestyle_advice: string | null;
  follow_up_instructions: string | null;
  generated_by: string;
  approved: boolean;
}

const DIAGNOSES = ["acne", "tinea", "eczema", "lichen", "other"] as const;
type DiagType = (typeof DIAGNOSES)[number];

const SEVERITY_COLOR: Record<string, string> = {
  mild: "#059669",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

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

export default function CaseWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const caseId = id && id !== "undefined" ? Number(id) : null;
  const step = Number(searchParams.get("step") || "1") as 1 | 2 | 3;
  const setStep = (s: 1 | 2 | 3) => setSearchParams({ step: String(s) });

  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [images, setImages] = useState<CaseImage[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMeds] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [priorCases, setPriorCases] = useState<PriorCase[]>([]);
  const [aiPreds, setAiPreds] = useState<AIPrediction[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const [aiRunning, setAiRunning] = useState(false);
  const [aiRunError, setAiRunError] = useState("");
  const [diagSelected, setDiagSelected] = useState<DiagType | "">("");
  const [diagNotes, setDiagNotes] = useState("");
  const [diagSubmitting, setDiagSubmitting] = useState(false);
  const [diagSuccess, setDiagSuccess] = useState(false);
  const [diagError, setDiagError] = useState("");

  const [txMedications, setTxMedications] = useState("");
  const [txLifestyle, setTxLifestyle] = useState("");
  const [txFollowUp, setTxFollowUp] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState("");
  const [aiSource, setAiSource] = useState<"llm" | "dermatologist">(
    "dermatologist"
  );

  useEffect(() => {
    if (!caseId) {
      navigate("/dermatologist/cases", { replace: true });
    }
  }, [caseId, navigate]);
// get case details
  const load = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/dermatologists/cases/${caseId}`, {
        headers: auth(),
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (res.status === 404) {
        setError("Case not found.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load case.");
      const data = await res.json();
      setDetail(data.case || null);
      setImages(data.images || []);
      setAllergies(data.allergies || []);
      setMeds(data.medications || []);
      setConditions(data.conditions || []);
      setPriorCases(data.priorCases || []);
      setAiPreds(data.aiPredictions || []);
      setDiagnosis(data.diagnosis || null);
      setTreatment(data.treatment || null);
      if (data.diagnosis) {
        setDiagSelected(data.diagnosis.final_diagnosis as DiagType);
        setDiagNotes(data.diagnosis.notes || "");
      }
      if (data.treatment) {
        setTxMedications(data.treatment.medications || "");
        setTxLifestyle(data.treatment.lifestyle_advice || "");
        setTxFollowUp(data.treatment.follow_up_instructions || "");
        setAiSource(
          data.treatment.generated_by === "llm" ? "llm" : "dermatologist"
        );
      }
      localStorage.setItem("derm_current_case_id", String(caseId));
      localStorage.setItem(
        "derm_current_case_name",
        data.case?.patient_name || "Patient"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load case.");
    } finally {
      setLoading(false);
    }
  }, [caseId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const ageFromDOB = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor(
      (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600000)
    );
  };

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

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const confColor = (score: number) => {
    if (score >= 85) return "#059669";
    if (score >= 70) return "#d97706";
    return "#ef4444";
  };

  const imgUrl = (file_path: string) => `${BASE_URL}/${file_path}`;
// AI analysis trigger
  const runAI = async () => {
    if (!caseId || images.length === 0) return; // confirm case exists and has images before allowing AI run
    setAiRunning(true);
    setAiRunError("");
    try {
      const res = await fetch(`${API}/dermatologists/cases/${caseId}/run-ai`, {
        method: "POST",
        headers: auth(),
      });
      if (!res.ok) throw new Error("AI analysis failed.");
      await load();
    } catch {
      setAiRunError(
        "AI analysis failed. Ensure images are uploaded and the model service is running."
      );
    } finally {
      setAiRunning(false);
    }
  };
// Diagnosis submission
  const submitDiagnosis = async () => {
    if (!diagSelected) {
      setDiagError("Please select a diagnosis.");
      return;
    }
    setDiagSubmitting(true);
    setDiagError("");
    try {
      const res = await fetch(
        `${API}/dermatologists/cases/${caseId}/diagnose`,
        {
          method: "POST",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({
            final_diagnosis: diagSelected,
            notes: diagNotes,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed.");
      }
      const data = await res.json();
      setDiagnosis(
        data.diagnosis || {
          final_diagnosis: diagSelected,
          notes: diagNotes,
          dermatologist_name: "",
          approved_at: new Date().toISOString(),
          diagnosis_id: 0,
        }
      );
      setDiagSuccess(true);
      setTimeout(() => {
        setDiagSuccess(false);
        setStep(3);
      }, 900);
    } catch (e) {
      setDiagError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setDiagSubmitting(false);
    }
  };

  const generateAITreatment = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch(
        `${API}/dermatologists/cases/${caseId}/treatment/generate`,
        {
          method: "POST",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({
            diagnosis: diagnosis?.final_diagnosis || diagSelected,
            patient_name: detail?.patient_name,
            patient_age: ageFromDOB(detail?.patient_dob ?? null),
            patient_sex: detail?.patient_sex,
            lesion_location: detail?.lesion_location,
            symptoms: detail?.symptoms,
            prior_treatment: detail?.prior_treatment,
            allergies: allergies.map((a) => a.allergy_name),
            current_medications: medications.map(
              (m) => `${m.medication_name} ${m.dosage}`
            ),
          }),
        }
      );
      if (!res.ok) throw new Error("AI generation failed.");
      const data = await res.json();
      setTxMedications(data.medications || "");
      setTxLifestyle(data.lifestyle_advice || "");
      setTxFollowUp(data.follow_up_instructions || "");
      setAiSource("llm");
    } catch {
      setTxError(
        "AI generation failed. Write the treatment plan manually below."
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const submitTreatment = async () => {
    if (!txMedications.trim()) {
      setTxError("Medications field is required.");
      return;
    }
    setTxSubmitting(true);
    setTxError("");
    try {
      const res = await fetch(
        `${API}/dermatologists/cases/${caseId}/treatment`,
        {
          method: "POST",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({
            medications: txMedications,
            lifestyle_advice: txLifestyle,
            follow_up_instructions: txFollowUp,
            generated_by: aiSource,
            approved: true,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed.");
      }
      setTxSuccess(true);
      setTimeout(() => {
        localStorage.removeItem("derm_current_case_id");
        localStorage.removeItem("derm_current_case_name");
        navigate("/dermatologist/cases?tab=completed");
      }, 1500);
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setTxSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1 as const, label: "Case Review", done: true },
    { num: 2 as const, label: "AI Diagnosis", done: !!diagnosis },
    { num: 3 as const, label: "Treatment", done: !!treatment },
  ];

  const latestAI = aiPreds[0] ?? null;
  const isFollowUp = !!detail?.parent_case_id;
  const isCompleted = detail?.status === "completed";
  const vitals = parseVitals(detail?.vitals_json ?? null);

  if (!loading && error)
    return (
      <div style={s.center}>
        <AlertTriangle size={36} color="#ef4444" />
        <p
          style={{
            color: "#1e293b",
            fontWeight: 700,
            margin: "0.75rem 0 0.25rem",
          }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate("/dermatologist/cases")}
          style={s.backBtn}
        >
          ← Back to Queue
        </button>
      </div>
    );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Top bar ── */}
      <div style={s.topBar}>
        <button
          type="button"
          onClick={() => navigate("/dermatologist/cases")}
          style={s.backBtnSm}
        >
          <ArrowLeft size={15} /> Back to Queue
        </button>
        <div style={s.caseIdentity}>
          <span style={s.caseIdChip}>Case #{caseId}</span>
          {isFollowUp ? (
            <span style={s.followUpBadge}>
              <RotateCcw size={10} /> Follow-up Case
            </span>
          ) : (
            <span style={s.newCaseBadge}>
              <CheckCircle size={10} /> New Case
            </span>
          )}
          {isCompleted && (
            <span style={s.completedBadge}>
              <Shield size={10} /> Completed
            </span>
          )}
          {detail && <span style={s.patientChip}>{detail.patient_name}</span>}
        </div>
        <div style={s.stepBar}>
          {STEPS.map((st, i) => {
            const isCurrent = step === st.num;
            const canClick =
              st.num === 1 || st.num === 2 || (st.num === 3 && !!diagnosis);
            const isDone = st.done && step > st.num;
            return (
              <React.Fragment key={st.num}>
                <div
                  style={{
                    ...s.stepItem,
                    ...(isCurrent ? s.stepCurrent : {}),
                    ...(isDone ? s.stepDone : {}),
                    cursor: canClick ? "pointer" : "not-allowed",
                    opacity: canClick ? 1 : 0.45,
                  }}
                  onClick={() => canClick && setStep(st.num)}
                >
                  <div
                    style={{
                      ...s.stepCircle,
                      ...(isCurrent ? s.stepCircleCurrent : {}),
                      ...(isDone ? s.stepCircleDone : {}),
                    }}
                  >
                    {isDone ? <CheckCircle size={12} /> : st.num}
                  </div>
                  <span>{st.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{ ...s.stepLine, ...(isDone ? s.stepLineDone : {}) }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <button
          type="button"
          onClick={load}
          style={s.refreshBtn}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            style={{
              animation: loading ? "spin 0.8s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      {loading ? (
        <div style={s.grid}>
          {[
            [120, 200, 100],
            [180, 160],
          ].map((heights, ci) => (
            <div
              key={ci}
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: "1rem",
              }}
            >
              {heights.map((h, i) => (
                <div key={i} style={s.card}>
                  <Sk h={`${h}px`} r="10px" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════
              STEP 1 — CASE REVIEW
          ══════════════════════════════════════════════════════ */}
          {step === 1 && detail && (
            <div style={{ ...s.grid, animation: "fadeIn 0.25s ease" }}>
              {/* LEFT */}
              <div style={s.col}>
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#e0f2fe" }}>
                      <User size={15} color="#0369a1" />
                    </div>
                    <span style={s.cardTitle}>Patient Demographics</span>
                    {isFollowUp && (
                      <span style={s.followUpBadge}>
                        <RotateCcw size={9} /> Follow-up
                      </span>
                    )}
                  </div>
                  <div style={s.infoGrid}>
                    {[
                      { label: "Full Name", value: detail.patient_name },
                      {
                        label: "Age",
                        value: ageFromDOB(detail.patient_dob)
                          ? `${ageFromDOB(detail.patient_dob)} years`
                          : "—",
                      },
                      {
                        label: "Sex",
                        value: detail.patient_sex
                          ? detail.patient_sex.charAt(0).toUpperCase() +
                            detail.patient_sex.slice(1)
                          : "—",
                      },
                      {
                        label: "DOB",
                        value: detail.patient_dob
                          ? fmtDate(detail.patient_dob)
                          : "—",
                      },
                      {
                        label: "Occupation",
                        value: detail.patient_occupation || "—",
                      },
                      {
                        label: "Contact",
                        value: detail.patient_contact || "—",
                      },
                    ].map((row) => (
                      <div key={row.label} style={s.infoItem}>
                        <span style={s.infoLabel}>{row.label}</span>
                        <span style={s.infoValue}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={s.referralBanner}>
                    <Stethoscope size={13} color="#3db5e6" />
                    <span style={s.referralText}>
                      Referred by <strong>{detail.clinician_name}</strong>
                      {detail.clinician_email && (
                        <> · {detail.clinician_email}</>
                      )}
                    </span>
                    <span style={s.referralDate}>
                      {fmtDate(detail.created_at)}
                    </span>
                  </div>
                </div>

                {isFollowUp && (
                  <div style={s.followUpCard}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <RotateCcw size={15} color="#7c3aed" />
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "#6d28d9",
                        }}
                      >
                        Follow-up — Linked to Case #{detail.parent_case_id}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.825rem",
                        color: "#5b21b6",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Review the patient's prior case history on the right
                      before proceeding.
                    </p>
                  </div>
                )}

                {allergies.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#fffbeb" }}>
                        <AlertTriangle size={15} color="#f59e0b" />
                      </div>
                      <span style={s.cardTitle}>Known Allergies</span>
                      <span style={s.countBadgeAmber}>{allergies.length}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                        gap: "0.5rem",
                        padding: "0.875rem 1.25rem",
                      }}
                    >
                      {allergies.map((a, i) => (
                        <div key={i} style={s.allergyItem}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={s.allergyName}>{a.allergy_name}</span>
                            <span
                              style={{
                                ...s.severityBadge,
                                backgroundColor:
                                  SEVERITY_COLOR[a.severity] + "18",
                                color: SEVERITY_COLOR[a.severity],
                              }}
                            >
                              {a.severity}
                            </span>
                          </div>
                          {a.reaction && (
                            <div style={s.allergyReaction}>
                              Reaction: {a.reaction}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {medications.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#faf5ff" }}>
                        <Pill size={15} color="#7c3aed" />
                      </div>
                      <span style={s.cardTitle}>Current Medications</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                        padding: "0.875rem 1.25rem",
                        gap: "0.5rem",
                      }}
                    >
                      {medications.map((m, i) => (
                        <div key={i} style={s.medRow}>
                          <span style={s.medName}>{m.medication_name}</span>
                          <span style={s.medDose}>{m.dosage}</span>
                          {m.start_date && (
                            <span style={s.medDate}>
                              since {fmtDate(m.start_date)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {conditions.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#f0fdf4" }}>
                        <History size={15} color="#059669" />
                      </div>
                      <span style={s.cardTitle}>Past Medical History</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                        padding: "0.875rem 1.25rem",
                        gap: "0.5rem",
                      }}
                    >
                      {conditions.map((cond, i) => (
                        <div key={i} style={s.conditionItem}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={s.conditionName}>
                              {cond.condition_name}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <span
                                style={{
                                  ...s.severityBadge,
                                  backgroundColor:
                                    SEVERITY_COLOR[cond.severity] + "18",
                                  color: SEVERITY_COLOR[cond.severity],
                                }}
                              >
                                {cond.severity}
                              </span>
                              <span style={s.conditionDate}>
                                {fmtDate(cond.date_recorded)}
                              </span>
                            </div>
                          </div>
                          {cond.notes && (
                            <div style={s.conditionNotes}>{cond.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div style={s.col}>
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#fef2f2" }}>
                      <Stethoscope size={15} color="#ef4444" />
                    </div>
                    <span style={s.cardTitle}>Clinical Findings</span>
                  </div>
                  <div style={s.findings}>
                    {[
                      {
                        label: "Chief Complaint",
                        value: detail.chief_complaint,
                      },
                      { label: "Symptoms", value: detail.symptoms },
                      {
                        label: "Lesion Location",
                        value: detail.lesion_location,
                      },
                      { label: "Lesion Type", value: detail.lesion_type },
                      { label: "Duration", value: detail.lesion_duration },
                      {
                        label: "Prior Treatment",
                        value: detail.prior_treatment,
                      },
                    ]
                      .filter((r) => r.value)
                      .map((row) => (
                        <div key={row.label} style={s.findingRow}>
                          <span style={s.findingLabel}>{row.label}</span>
                          <span style={s.findingValue}>{row.value}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {vitals && Object.values(vitals).some(Boolean) && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#fef2f2" }}>
                        <Heart size={15} color="#ef4444" />
                      </div>
                      <span style={s.cardTitle}>
                        Vitals — Recorded by Clinician
                      </span>
                    </div>
                    <div style={s.vitalsGrid}>
                      {Object.entries(vitals)
                        .filter(([, v]) => v)
                        .map(([key, val]) => (
                          <div key={key} style={s.vitalItem}>
                            <div style={s.vitalLabel}>
                              {key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </div>
                            <div style={s.vitalValue}>{String(val)}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#fff7ed" }}>
                      <ImageIcon size={15} color="#ea580c" />
                    </div>
                    <span style={s.cardTitle}>
                      Lesion Images ({images.length})
                    </span>
                    <span
                      style={{
                        ...s.countBadge,
                        backgroundColor:
                          images.length > 0 ? "#d1fae5" : "#fee2e2",
                        color: images.length > 0 ? "#059669" : "#ef4444",
                      }}
                    >
                      {images.length > 0
                        ? `${images.length} uploaded`
                        : "None — AI blocked"}
                    </span>
                  </div>
                  {images.length === 0 ? (
                    <div style={s.emptyBox}>
                      <ImageIcon size={28} color="#cbd5e1" />
                      <p
                        style={{ color: "#94a3b8", margin: 0, fontWeight: 600 }}
                      >
                        No images uploaded
                      </p>
                      <p
                        style={{
                          color: "#cbd5e1",
                          margin: 0,
                          fontSize: "0.8rem",
                        }}
                      >
                        AI analysis will not be available for this case.
                      </p>
                    </div>
                  ) : (
                    <div style={s.imageGrid}>
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          style={s.thumb}
                          onClick={() => setLightbox(idx)}
                          onMouseEnter={(e) => {
                            (e.currentTarget.querySelector(
                              ".overlay"
                            ) as HTMLElement)!.style.backgroundColor =
                              "rgba(0,0,0,0.35)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget.querySelector(
                              ".overlay"
                            ) as HTMLElement)!.style.backgroundColor =
                              "rgba(0,0,0,0)";
                          }}
                        >
                          <img
                            src={imgUrl(img.file_path)}
                            alt={`Lesion ${idx + 1}`}
                            style={s.thumbImg}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "/placeholder.png";
                            }}
                          />
                          <div className="overlay" style={s.thumbOverlay}>
                            <ZoomIn size={16} color="#fff" />
                          </div>
                          <div style={s.thumbLabel}>Image {idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {priorCases.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#f0f9ff" }}>
                        <ClipboardList size={15} color="#3db5e6" />
                      </div>
                      <span style={s.cardTitle}>Patient's Prior Cases</span>
                      <span
                        style={{
                          ...s.countBadge,
                          backgroundColor: "#e0f2fe",
                          color: "#3db5e6",
                        }}
                      >
                        {priorCases.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                      }}
                    >
                      {priorCases.map((pc) => (
                        <div key={pc.case_id} style={s.priorCaseItem}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div>
                              <span style={s.priorCaseId}>#{pc.case_id}</span>
                              <span style={s.priorCaseComplaint}>
                                {pc.chief_complaint}
                              </span>
                            </div>
                            <span style={s.priorCaseDate}>
                              {fmtDate(pc.created_at)}
                            </span>
                          </div>
                          {pc.final_diagnosis && (
                            <div style={s.priorCaseDiag}>
                              Dx: <strong>{pc.final_diagnosis}</strong>
                              {pc.treatment && <> · Rx: {pc.treatment}</>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  style={s.proceedBtn}
                  onClick={() => setStep(2)}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <Brain size={16} /> Proceed to AI Diagnosis
                  <ChevronRight size={15} style={{ marginLeft: "auto" }} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
    STEP 2 — AI DIAGNOSIS
══════════════════════════════════════════════════════ */}
          {step === 2 && detail && (
            <div style={{ ...s.grid, animation: "fadeIn 0.25s ease" }}>
              {/* LEFT */}
              <div style={s.col}>
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#e0f2fe" }}>
                      <User size={15} color="#0369a1" />
                    </div>
                    <span style={s.cardTitle}>Patient Summary</span>
                    {isFollowUp && (
                      <span style={s.followUpBadge}>
                        <RotateCcw size={9} /> Follow-up
                      </span>
                    )}
                  </div>
                  <div style={s.findings}>
                    {[
                      {
                        label: "Patient",
                        value: `${detail.patient_name}, ${
                          ageFromDOB(detail.patient_dob) ?? "—"
                        } yrs, ${detail.patient_sex ?? "—"}`,
                      },
                      { label: "Complaint", value: detail.chief_complaint },
                      { label: "Symptoms", value: detail.symptoms },
                      { label: "Location", value: detail.lesion_location },
                      { label: "Duration", value: detail.lesion_duration },
                      { label: "Prior Tx", value: detail.prior_treatment },
                    ]
                      .filter((r) => r.value)
                      .map((row) => (
                        <div key={row.label} style={s.findingRow}>
                          <span style={s.findingLabel}>{row.label}</span>
                          <span style={s.findingValue}>{row.value}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {allergies.length > 0 && (
                  <div
                    style={{
                      ...s.card,
                      borderWidth: "1.5px",
                      borderStyle: "solid",
                      borderColor: "#fde68a",
                    }}
                  >
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#fffbeb" }}>
                        <AlertTriangle size={15} color="#f59e0b" />
                      </div>
                      <span style={s.cardTitle}>
                        Allergies — Consider Before Diagnosis
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "0.875rem 1.25rem",
                        display: "flex",
                        flexDirection: "column" as const,
                        gap: "0.5rem",
                      }}
                    >
                      {allergies.map((a, i) => (
                        <div key={i} style={s.allergyItem}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={s.allergyName}>{a.allergy_name}</span>
                            <span
                              style={{
                                ...s.severityBadge,
                                backgroundColor:
                                  SEVERITY_COLOR[a.severity] + "18",
                                color: SEVERITY_COLOR[a.severity],
                              }}
                            >
                              {a.severity}
                            </span>
                          </div>
                          {a.reaction && (
                            <div style={s.allergyReaction}>{a.reaction}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {priorCases.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#f0f9ff" }}>
                        <History size={15} color="#3db5e6" />
                      </div>
                      <span style={s.cardTitle}>
                        Prior Diagnoses — Same Patient
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                      }}
                    >
                      {priorCases.map((pc) => (
                        <div key={pc.case_id} style={s.priorCaseItem}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={s.priorCaseId}>
                              Case #{pc.case_id}
                            </span>
                            <span style={s.priorCaseDate}>
                              {fmtDate(pc.created_at)}
                            </span>
                          </div>
                          <div style={s.priorCaseComplaint}>
                            {pc.chief_complaint}
                          </div>
                          {pc.final_diagnosis && (
                            <div style={s.priorCaseDiag}>
                              Dx: <strong>{pc.final_diagnosis}</strong>
                              {pc.treatment && <> · Rx: {pc.treatment}</>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {medications.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#faf5ff" }}>
                        <Pill size={15} color="#7c3aed" />
                      </div>
                      <span style={s.cardTitle}>Current Medications</span>
                    </div>
                    <div
                      style={{
                        padding: "0.875rem 1.25rem",
                        display: "flex",
                        flexDirection: "column" as const,
                        gap: "0.5rem",
                      }}
                    >
                      {medications.map((m, i) => (
                        <div key={i} style={s.medRow}>
                          <span style={s.medName}>{m.medication_name}</span>
                          <span style={s.medDose}>{m.dosage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {images.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#fff7ed" }}>
                        <ImageIcon size={15} color="#ea580c" />
                      </div>
                      <span style={s.cardTitle}>Reference Images</span>
                    </div>
                    <div style={{ ...s.imageGrid, padding: "0.875rem" }}>
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          style={s.thumb}
                          onClick={() => setLightbox(idx)}
                        >
                          <img
                            src={imgUrl(img.file_path)}
                            alt={`Lesion ${idx + 1}`}
                            style={s.thumbImg}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "/placeholder.png";
                            }}
                          />
                          <div className="overlay" style={s.thumbOverlay}>
                            <Eye size={14} color="#fff" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div style={s.col}>
                {/* AI Analysis card */}
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#f5f3ff" }}>
                      <Brain size={15} color="#8b5cf6" />
                    </div>
                    <span style={s.cardTitle}>AI Model Analysis</span>
                    {latestAI && (
                      <span style={s.aiSourceTag}>
                        <Sparkles size={11} /> Model {latestAI.model_version}
                      </span>
                    )}
                  </div>

                  {images.length === 0 && (
                    <div style={s.emptyBox}>
                      <Brain size={28} color="#cbd5e1" />
                      <p
                        style={{ color: "#374151", fontWeight: 600, margin: 0 }}
                      >
                        AI analysis unavailable
                      </p>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.8rem",
                          margin: 0,
                        }}
                      >
                        No images uploaded. Proceed with manual diagnosis below.
                      </p>
                    </div>
                  )}

                  {images.length > 0 && !latestAI && (
                    <div
                      style={{
                        padding: "1.5rem 1.25rem",
                        display: "flex",
                        flexDirection: "column" as const,
                        alignItems: "center",
                        textAlign: "center" as const,
                        gap: "0.875rem",
                      }}
                    >
                      <Brain
                        size={36}
                        color="#8b5cf6"
                        style={{ opacity: 0.4 }}
                      />
                      <div>
                        <p
                          style={{
                            color: "#1e293b",
                            fontWeight: 700,
                            margin: "0 0 0.3rem",
                          }}
                        >
                          AI analysis has not been run yet
                        </p>
                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "0.825rem",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                          ready. Click below to run the model.
                        </p>
                      </div>
                      {aiRunError && (
                        <div style={s.errorBox}>
                          <AlertTriangle size={13} /> {aiRunError}
                        </div>
                      )}
                      <button
                        type="button"
                        style={s.runAiBtn}
                        onClick={runAI}
                        disabled={aiRunning}
                      >
                        {aiRunning ? (
                          <>
                            <div
                              style={{
                                ...s.btnSpinner,
                                borderTopColor: "#fff",
                              }}
                            />{" "}
                            Analysing…
                          </>
                        ) : (
                          <>
                            <Brain size={15} /> Run AI Analysis
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {latestAI && (
                    <div style={{ padding: "1rem 1.25rem" }}>
                      <div style={s.aiLabel}>Predicted Condition</div>
                      <div style={s.aiCondition}>
                        {latestAI.predicted_label.charAt(0).toUpperCase() +
                          latestAI.predicted_label.slice(1)}
                      </div>
                      <div style={s.confRow}>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          Confidence
                        </span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: confColor(latestAI.confidence_score),
                          }}
                        >
                          {Math.round(latestAI.confidence_score)}%
                        </span>
                      </div>
                      <div style={s.confBg}>
                        <div
                          style={{
                            ...s.confFill,
                            width: `${latestAI.confidence_score}%`,
                            backgroundColor: confColor(
                              latestAI.confidence_score
                            ),
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: "0.875rem",
                          padding: "0.65rem 0.875rem",
                          backgroundColor: "#fffbeb",
                          borderRadius: "8px",
                          borderWidth: "1px",
                          borderStyle: "solid" as const,
                          borderColor: "#fde68a",
                          fontSize: "0.775rem",
                          color: "#92400e",
                          lineHeight: 1.5,
                        }}
                      >
                        ⚠ AI prediction is advisory only. Your clinical
                        judgement overrides this.
                        {latestAI.confidence_score < 70 &&
                          " Low confidence — manual override strongly recommended."}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "#94a3b8",
                          marginTop: "0.5rem",
                        }}
                      >
                        Run {fmtDate(latestAI.created_at)}
                      </div>
                      <button
                        type="button"
                        style={{ ...s.ghostBtn, marginTop: "0.75rem" }}
                        onClick={runAI}
                        disabled={aiRunning}
                      >
                        <RefreshCw
                          size={13}
                          style={{
                            animation: aiRunning
                              ? "spin 1s linear infinite"
                              : "none",
                          }}
                        />
                        {aiRunning ? " Running…" : " Re-run AI Analysis"}
                      </button>
                    </div>
                  )}
                </div>

                {/* DIAGNOSIS FORM CARD */}
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#f0fdf4" }}>
                      <FileText size={15} color="#059669" />
                    </div>
                    <span style={s.cardTitle}>
                      {diagnosis ? "Update Diagnosis" : "Submit Diagnosis"}
                    </span>
                    {diagnosis && <span style={s.savedTag}>Saved</span>}
                  </div>

                  <div style={s.formBody}>
                    {/* 1. Diagnosis option buttons */}
                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>Final Diagnosis *</label>
                      <div style={s.diagGrid}>
                        {DIAGNOSES.map((d) => {
                          const isAI = latestAI?.predicted_label === d;
                          const isSelected = diagSelected === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setDiagSelected(d);
                                setDiagError("");
                              }}
                              style={{
                                ...s.diagBtn,
                                ...(isSelected ? s.diagBtnSelected : {}),
                                ...(isAI && !isSelected ? s.diagBtnAI : {}),
                              }}
                            >
                              <span>
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                              </span>
                              {isAI && (
                                <span
                                  style={{
                                    fontSize: "0.6rem",
                                    backgroundColor: isSelected
                                      ? "rgba(255,255,255,0.25)"
                                      : "#ede9fe",
                                    color: isSelected ? "#fff" : "#7c3aed",
                                    padding: "0.1rem 0.35rem",
                                    borderRadius: "4px",
                                    fontWeight: 700,
                                  }}
                                >
                                  AI
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {latestAI &&
                        diagSelected &&
                        diagSelected !== latestAI.predicted_label && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontSize: "0.75rem",
                              color: "#92400e",
                              marginTop: "0.5rem",
                            }}
                          >
                            <AlertTriangle size={11} color="#f59e0b" />
                            Overriding AI suggestion ({latestAI.predicted_label}
                            )
                          </div>
                        )}
                    </div>

                    {/* 2. Clinical notes */}
                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>
                        Clinical Notes{" "}
                        <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                          (optional)
                        </span>
                      </label>
                      <textarea
                        value={diagNotes}
                        onChange={(e) => setDiagNotes(e.target.value)}
                        placeholder="Add clinical reasoning, differential diagnoses, or observations…"
                        rows={5}
                        style={s.textarea}
                      />
                    </div>

                    {/* 3. Error banner */}
                    {diagError && (
                      <div style={s.errorBox}>
                        <AlertTriangle size={14} /> {diagError}
                      </div>
                    )}

                    {/* 4. Submit button */}
                    <button
                      type="button"
                      onClick={submitDiagnosis}
                      disabled={diagSubmitting || !diagSelected}
                      style={{
                        ...s.submitBtn,
                        opacity: diagSubmitting || !diagSelected ? 0.6 : 1,
                        cursor:
                          diagSubmitting || !diagSelected
                            ? "not-allowed"
                            : "pointer",
                        backgroundImage: diagSuccess
                          ? "linear-gradient(135deg,#059669,#047857)"
                          : "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                      }}
                    >
                      {diagSuccess ? (
                        <>
                          <CheckCircle size={16} /> Diagnosis Saved — Moving to
                          Treatment…
                        </>
                      ) : diagSubmitting ? (
                        <>
                          <div style={s.btnSpinner} /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />{" "}
                          {diagnosis
                            ? "Update Diagnosis"
                            : "Confirm Diagnosis & Continue"}
                        </>
                      )}
                    </button>

                    {/* 5. Back button */}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={s.ghostBtn}
                    >
                      ← Back to Case Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 3 — TREATMENT PLAN
          ══════════════════════════════════════════════════════ */}
          {step === 3 && detail && (
            <div style={{ ...s.grid, animation: "fadeIn 0.25s ease" }}>
              {/* LEFT */}
              <div style={s.col}>
                <div
                  style={{
                    ...s.card,
                    borderLeftWidth: "3px",
                    borderLeftStyle: "solid" as const,
                    borderLeftColor: "#8b5cf6",
                  }}
                >
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#f5f3ff" }}>
                      <CheckCircle size={15} color="#8b5cf6" />
                    </div>
                    <span style={s.cardTitle}>Confirmed Diagnosis</span>
                  </div>
                  <div style={{ padding: "0.875rem 1.25rem" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        textTransform: "capitalize" as const,
                      }}
                    >
                      {diagnosis?.final_diagnosis || diagSelected || "—"}
                    </div>
                    {diagnosis?.notes && (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#475569",
                          margin: "0.5rem 0 0",
                          lineHeight: 1.6,
                        }}
                      >
                        {diagnosis.notes}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#94a3b8",
                        marginTop: "0.5rem",
                      }}
                    >
                      {diagnosis?.dermatologist_name &&
                        `By ${diagnosis.dermatologist_name}`}
                      {diagnosis?.approved_at &&
                        ` · ${fmtDate(diagnosis.approved_at)}`}
                    </div>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#e0f2fe" }}>
                      <User size={15} color="#0369a1" />
                    </div>
                    <span style={s.cardTitle}>Patient Reference</span>
                  </div>
                  <div style={s.findings}>
                    {[
                      {
                        label: "Patient",
                        value: `${detail.patient_name}, ${
                          ageFromDOB(detail.patient_dob) ?? "—"
                        } yrs`,
                      },
                      {
                        label: "Contact",
                        value: detail.patient_contact || "—",
                      },
                      { label: "Complaint", value: detail.chief_complaint },
                      {
                        label: "Location",
                        value: detail.lesion_location || "—",
                      },
                    ]
                      .filter((r) => r.value)
                      .map((row) => (
                        <div key={row.label} style={s.findingRow}>
                          <span style={s.findingLabel}>{row.label}</span>
                          <span style={s.findingValue}>{row.value}</span>
                        </div>
                      ))}
                  </div>
                  {allergies.length > 0 && (
                    <div
                      style={{
                        margin: "0 1.25rem 1rem",
                        padding: "0.6rem 0.75rem",
                        backgroundColor: "#fffbeb",
                        borderWidth: "1px",
                        borderStyle: "solid" as const,
                        borderColor: "#fde68a",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                      }}
                    >
                      <AlertTriangle
                        size={14}
                        color="#d97706"
                        style={{ flexShrink: 0, marginTop: "0.1rem" }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "#92400e" }}>
                        <strong>Allergies:</strong>{" "}
                        {allergies.map((a) => a.allergy_name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {priorCases.some((pc) => pc.treatment) && (
                  <div style={s.card}>
                    <div style={s.cardHeader}>
                      <div style={{ ...s.iconBox, backgroundColor: "#faf5ff" }}>
                        <History size={15} color="#7c3aed" />
                      </div>
                      <span style={s.cardTitle}>Prior Treatment History</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                      }}
                    >
                      {priorCases
                        .filter((pc) => pc.treatment)
                        .map((pc) => (
                          <div key={pc.case_id} style={s.priorCaseItem}>
                            <span style={s.priorCaseId}>
                              Case #{pc.case_id}
                            </span>
                            {pc.final_diagnosis && (
                              <div style={s.priorCaseDiag}>
                                Dx: <strong>{pc.final_diagnosis}</strong>
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#374151",
                                marginTop: "0.2rem",
                              }}
                            >
                              Rx: {pc.treatment}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT — treatment form */}
              <div style={s.col}>
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.iconBox, backgroundColor: "#f0fdf4" }}>
                      <Pill size={15} color="#059669" />
                    </div>
                    <span style={s.cardTitle}>Treatment Plan</span>
                    {aiSource === "llm" && (
                      <span style={s.aiSourceTag}>
                        <Sparkles size={11} /> AI-assisted
                      </span>
                    )}
                  </div>

                  <div style={s.formBody}>
                    <button
                      type="button"
                      onClick={generateAITreatment}
                      disabled={aiGenerating || (!diagnosis && !diagSelected)}
                      style={s.aiGenerateBtn}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#ede9fe")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f3ff")
                      }
                    >
                      {aiGenerating ? (
                        <>
                          <div
                            style={{
                              ...s.btnSpinner,
                              borderTopColor: "#8b5cf6",
                            }}
                          />{" "}
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} color="#8b5cf6" /> Generate
                          Treatment with AI
                        </>
                      )}
                    </button>

                    <div style={s.orDivider}>
                      <div style={s.orLine} />
                      <span style={s.orText}>or write manually</span>
                      <div style={s.orLine} />
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>
                        <Pill size={13} color="#059669" /> Medications *
                      </label>
                      <textarea
                        value={txMedications}
                        onChange={(e) => {
                          setTxMedications(e.target.value);
                          setAiSource("dermatologist");
                        }}
                        placeholder={
                          "e.g. Clindamycin 1% gel — apply BD to affected area for 8 weeks\nDoxycycline 100mg — once daily for 6 weeks"
                        }
                        rows={4}
                        style={s.textarea}
                      />
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>
                        <Activity size={13} color="#059669" /> Lifestyle &
                        Skincare Advice
                      </label>
                      <textarea
                        value={txLifestyle}
                        onChange={(e) => {
                          setTxLifestyle(e.target.value);
                          setAiSource("dermatologist");
                        }}
                        placeholder="e.g. Use non-comedogenic sunscreen daily, avoid picking lesions…"
                        rows={3}
                        style={s.textarea}
                      />
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>
                        <Clock size={13} color="#059669" /> Follow-up
                        Instructions
                      </label>
                      <textarea
                        value={txFollowUp}
                        onChange={(e) => {
                          setTxFollowUp(e.target.value);
                          setAiSource("dermatologist");
                        }}
                        placeholder="e.g. Review in 8 weeks. If no improvement, consider oral isotretinoin."
                        rows={3}
                        style={s.textarea}
                      />
                    </div>

                    {txError && (
                      <div style={s.errorBox}>
                        <AlertTriangle size={14} /> {txError}
                      </div>
                    )}

                    {(() => {
                      const medsText =
                        typeof txMedications === "string" ? txMedications : "";

                      return (
                        <>
                          <button
                            type="button"
                            onClick={submitTreatment}
                            disabled={txSubmitting || !medsText.trim()}
                            style={{
                              ...s.submitBtn,
                              opacity:
                                txSubmitting || !medsText.trim() ? 0.6 : 1,
                              cursor:
                                txSubmitting || !medsText.trim()
                                  ? "not-allowed"
                                  : "pointer",
                              backgroundImage: txSuccess
                                ? "linear-gradient(135deg,#059669,#047857)"
                                : "linear-gradient(135deg,#3db5e6,#1e88d4)",
                            }}
                          >
                            {txSuccess ? (
                              <>
                                <CheckCircle size={16} /> Sent to Clinician —
                                Redirecting…
                              </>
                            ) : txSubmitting ? (
                              <>
                                <div style={s.btnSpinner} /> Saving…
                              </>
                            ) : (
                              <>
                                <Send size={15} /> Approve & Send to Clinician
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            style={s.ghostBtn}
                          >
                            ← Back to Diagnosis
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox !== null && images.length > 0 && (
        <div style={s.lbOverlay} onClick={() => setLightbox(null)}>
          <button
            type="button"
            style={s.lbClose}
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          <div style={s.lbNav} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              style={s.lbArrow}
              onClick={() =>
                setLightbox((lightbox - 1 + images.length) % images.length)
              }
            >
              ‹
            </button>
            <img
              src={imgUrl(images[lightbox].file_path)}
              alt="Lesion"
              style={s.lbImg}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
              }}
            />
            <button
              type="button"
              style={s.lbArrow}
              onClick={() => setLightbox((lightbox + 1) % images.length)}
            >
              ›
            </button>
          </div>
          <div style={s.lbCounter}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: "0.75rem",
    textAlign: "center",
  },
  backBtn: {
    padding: "0.55rem 1.25rem",
    backgroundColor: "#3db5e6",
    color: "#fff",
    borderWidth: 0,
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    backgroundColor: "#fff",
    borderRadius: "14px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    padding: "0.875rem 1.25rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    flexWrap: "wrap",
  },
  backBtnSm: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.45rem 0.875rem",
    backgroundColor: "#f1f5f9",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.825rem",
    fontWeight: 600,
    color: "#475569",
    flexShrink: 0,
  },
  refreshBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    marginLeft: "auto",
  },
  caseIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
  caseIdChip: {
    fontSize: "0.8rem",
    fontFamily: "monospace",
    fontWeight: 800,
    color: "#3db5e6",
  },
  patientChip: { fontSize: "0.8rem", color: "#64748b", fontWeight: 500 },
  followUpBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#7c3aed",
    backgroundColor: "#faf5ff",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e9d5ff",
    borderRadius: "10px",
    padding: "0.15rem 0.5rem",
  },
  newCaseBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#059669",
    backgroundColor: "#d1fae5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#6ee7b7",
    borderRadius: "10px",
    padding: "0.15rem 0.5rem",
  },
  completedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#3db5e6",
    backgroundColor: "#e0f2fe",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#bae6fd",
    borderRadius: "10px",
    padding: "0.15rem 0.5rem",
  },
  stepBar: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.825rem",
    fontWeight: 600,
    color: "#94a3b8",
    transition: "all 0.15s",
  },
  stepCurrent: { color: "#1e293b" },
  stepDone: { color: "#059669" },
  stepCircle: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#94a3b8",
    flexShrink: 0,
  },
  stepCircleCurrent: {
    backgroundColor: "#3db5e6",
    color: "#fff",
    boxShadow: "0 0 0 3px rgba(61,181,230,0.2)",
  },
  stepCircleDone: { backgroundColor: "#059669", color: "#fff" },
  stepLine: {
    width: "48px",
    height: "2px",
    backgroundColor: "#e2e8f0",
    margin: "0 0.5rem",
  },
  stepLineDone: { backgroundColor: "#059669" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem",
    alignItems: "start",
  },
  col: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.875rem 1.25rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#1e293b",
    flex: 1,
  },
  iconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  savedTag: {
    fontSize: "0.68rem",
    backgroundColor: "#f0fdf4",
    color: "#059669",
    padding: "0.15rem 0.5rem",
    borderRadius: "6px",
    fontWeight: 600,
  },
  aiSourceTag: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.68rem",
    backgroundColor: "#f5f3ff",
    color: "#7c3aed",
    padding: "0.15rem 0.5rem",
    borderRadius: "6px",
    fontWeight: 600,
  },
  countBadge: {
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "0.15rem 0.5rem",
    borderRadius: "6px",
  },
  countBadgeAmber: {
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "0.15rem 0.5rem",
    borderRadius: "6px",
    backgroundColor: "#fffbeb",
    color: "#d97706",
  },
  referralBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0 1.25rem 1rem",
    padding: "0.6rem 0.875rem",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#bae6fd",
  },
  referralText: { fontSize: "0.8rem", color: "#0369a1", flex: 1 },
  referralDate: { fontSize: "0.7rem", color: "#64748b" },
  followUpCard: {
    backgroundColor: "#faf5ff",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "#e9d5ff",
    borderRadius: "12px",
    padding: "1rem",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.875rem",
    padding: "1rem 1.25rem",
  },
  infoItem: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  infoLabel: {
    fontSize: "0.68rem",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: { fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" },
  findings: { display: "flex", flexDirection: "column" },
  findingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.6rem 1.25rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#f8fafc",
  },
  findingLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  findingValue: {
    fontSize: "0.85rem",
    color: "#1e293b",
    fontWeight: 500,
    textAlign: "right",
    maxWidth: "60%",
  },
  vitalsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "0.75rem",
    padding: "1rem 1.25rem",
  },
  vitalItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "0.65rem",
    textAlign: "center",
  },
  vitalLabel: {
    fontSize: "0.62rem",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  vitalValue: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#1e293b",
    marginTop: "0.2rem",
  },
  allergyItem: {
    padding: "0.55rem 0.75rem",
    backgroundColor: "#fffbeb",
    borderRadius: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#fde68a",
  },
  allergyName: { fontSize: "0.875rem", fontWeight: 700, color: "#92400e" },
  allergyReaction: {
    fontSize: "0.775rem",
    color: "#a16207",
    marginTop: "0.15rem",
  },
  severityBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "0.15rem 0.5rem",
    borderRadius: "8px",
  },
  medRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    padding: "0.35rem 0",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
  },
  medName: { fontSize: "0.825rem", fontWeight: 600, color: "#1e293b", flex: 1 },
  medDose: { fontSize: "0.775rem", color: "#7c3aed", fontWeight: 500 },
  medDate: { fontSize: "0.7rem", color: "#94a3b8" },
  conditionItem: {
    padding: "0.55rem 0.75rem",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#bbf7d0",
  },
  conditionName: { fontSize: "0.875rem", fontWeight: 700, color: "#065f46" },
  conditionDate: { fontSize: "0.7rem", color: "#94a3b8" },
  conditionNotes: {
    fontSize: "0.775rem",
    color: "#047857",
    marginTop: "0.15rem",
  },
  priorCaseItem: {
    padding: "0.75rem 1.25rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#f8fafc",
  },
  priorCaseId: {
    fontSize: "0.72rem",
    fontFamily: "monospace",
    fontWeight: 700,
    color: "#3db5e6",
    marginRight: "0.4rem",
  },
  priorCaseComplaint: {
    fontSize: "0.825rem",
    color: "#374151",
    fontWeight: 500,
  },
  priorCaseDiag: {
    fontSize: "0.775rem",
    color: "#0369a1",
    marginTop: "0.2rem",
  },
  priorCaseDate: { fontSize: "0.7rem", color: "#94a3b8" },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "2rem",
    color: "#94a3b8",
    fontSize: "0.85rem",
    textAlign: "center",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "0.5rem",
    padding: "0.875rem",
  },
  thumb: {
    position: "relative",
    aspectRatio: "1",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f1f5f9",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  thumbLabel: {
    position: "absolute",
    bottom: "0.3rem",
    left: "0.35rem",
    fontSize: "0.6rem",
    color: "#fff",
    fontWeight: 700,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: "4px",
    padding: "0.1rem 0.3rem",
  },
  aiLabel: {
    fontSize: "0.68rem",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "0.25rem",
  },
  aiCondition: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  confRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.35rem",
  },
  confBg: {
    height: "6px",
    backgroundColor: "#f1f5f9",
    borderRadius: "3px",
    overflow: "hidden",
  },
  confFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  runAiBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    backgroundImage: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    color: "#fff",
    borderWidth: 0,
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  formBody: {
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  fieldLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.825rem",
    fontWeight: 700,
    color: "#374151",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "10px",
    fontSize: "0.875rem",
    color: "#1e293b",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.6,
    boxSizing: "border-box",
    backgroundColor: "#fafafa",
  },
  // FIX 2: auto-fill grid so all 5 buttons fit without overflow or orphaned items
  diagGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "0.5rem",
  },
  diagBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.35rem",
    padding: "0.65rem 0.75rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
    fontSize: "0.825rem",
    fontWeight: 600,
    color: "#374151",
    transition: "all 0.15s",
  },
  diagBtnSelected: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(139,92,246,0.3)",
  },
  diagBtnAI: {
    borderColor: "#c4b5fd",
    backgroundColor: "#faf5ff",
    color: "#6d28d9",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 0.875rem",
    backgroundColor: "#fef2f2",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#fecaca",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "0.825rem",
    fontWeight: 500,
  },
  proceedBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.875rem 1rem",
    backgroundImage: "linear-gradient(135deg,#3db5e6,#1e88d4)",
    color: "#fff",
    borderWidth: 0,
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  // FIX 3: cursor: "pointer" now in base style — no longer missing
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.875rem",
    color: "#fff",
    borderWidth: 0,
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "0.9rem",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  ghostBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    width: "100%",
    padding: "0.65rem",
    backgroundColor: "transparent",
    color: "#64748b",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.825rem",
    fontWeight: 600,
  },
  aiGenerateBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#f5f3ff",
    color: "#6d28d9",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#c4b5fd",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 700,
    transition: "background-color 0.15s",
  },
  btnSpinner: {
    width: "14px",
    height: "14px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  orDivider: { display: "flex", alignItems: "center", gap: "0.75rem" },
  orLine: { flex: 1, height: "1px", backgroundColor: "#e5e7eb" },
  orText: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  lbOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.88)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  lbClose: {
    position: "absolute",
    top: "1.25rem",
    right: "1.25rem",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 0,
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
  },
  lbNav: { display: "flex", alignItems: "center", gap: "1.5rem" },
  lbArrow: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 0,
    color: "#fff",
    fontSize: "2.5rem",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lbImg: {
    maxHeight: "75vh",
    maxWidth: "70vw",
    borderRadius: "12px",
    objectFit: "contain",
  },
  lbCounter: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.875rem",
    marginTop: "1rem",
  },
};
