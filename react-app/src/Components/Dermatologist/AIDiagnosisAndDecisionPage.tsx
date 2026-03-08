// src/Components/Dermatologist/AIDiagnosisAndDecisionPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Clock,
  Activity,
  Eye,
  ImageIcon,
  Stethoscope,
  User,
  ZoomIn,
  X,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Pill,
  FileText,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}";
const IMG_URL = "import.meta.env.VITE_UPLOADS_URL";
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface CaseDetail {
  case_id: number;
  patient_name: string;
  patient_dob: string | null;
  patient_sex: string | null;
  chief_complaint: string;
  lesion_location: string;
  lesion_type: string | null;
  lesion_duration: string | null;
  symptoms: string | null;
  prior_treatment: string | null;
  clinician_name: string;
  created_at: string;
  status: string;
}

interface CaseImage {
  id: number;
  file_path: string;
}

interface AIPrediction {
  predicted_label: string;
  confidence_score: number;
  model_version: string;
  created_at: string;
}

// ─── Possible dermatological diagnoses for override dropdown ──────────────────
const DIAGNOSIS_OPTIONS = [
  "Melanoma",
  "Basal Cell Carcinoma",
  "Squamous Cell Carcinoma",
  "Actinic Keratosis",
  "Atopic Dermatitis (Eczema)",
  "Psoriasis",
  "Contact Dermatitis",
  "Tinea Corporis (Ringworm)",
  "Tinea Versicolor",
  "Seborrheic Dermatitis",
  "Rosacea",
  "Urticaria (Hives)",
  "Vitiligo",
  "Alopecia Areata",
  "Folliculitis",
  "Impetigo",
  "Cellulitis",
  "Herpes Zoster (Shingles)",
  "Molluscum Contagiosum",
  "Scabies",
  "Other (specify in notes)",
];

export default function AIDiagnosisAndDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [images, setImages] = useState<CaseImage[]>([]);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [aiDecision, setAiDecision] = useState<"accept" | "override" | null>(
    null
  );
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  // ── Lightbox ──────────────────────────────────────────────────────────────
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // ── Fetch case ────────────────────────────────────────────────────────────
  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/dermatologists/cases/${id}`, {
        headers: auth(),
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCaseData(data.case || null);
      setImages(data.images || []);
      setPrediction(data.prediction || null);

      // If already diagnosed, redirect to case review
      if (data.diagnosis) {
        navigate(`/dermatologist/case/${id}`, { replace: true });
      }
    } catch {
      setError("Failed to load case. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // ── When AI decision changes, pre-fill diagnosis ──────────────────────────
  useEffect(() => {
    if (aiDecision === "accept" && prediction) {
      const label = prediction.predicted_label;
      setFinalDiagnosis(label.charAt(0).toUpperCase() + label.slice(1));
    } else if (aiDecision === "override") {
      setFinalDiagnosis("");
    }
  }, [aiDecision, prediction]);

  // ── Submit diagnosis ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const diagnosis =
      finalDiagnosis === "Other (specify in notes)"
        ? customDiagnosis.trim()
        : finalDiagnosis.trim();

    if (!aiDecision) {
      setError("Please accept or override the AI prediction first.");
      return;
    }
    if (!diagnosis) {
      setError("Please select or enter a final diagnosis.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/dermatologists/cases/${id}/diagnose`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({
          final_diagnosis: diagnosis,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Submission failed");
      }
      setSuccess(true);
      setTimeout(() => navigate(`/dermatologist/treatment/${id}`), 1800);
    } catch (err: any) {
      setError(err.message || "Failed to submit diagnosis.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.85) return "#059669";
    if (score >= 0.7) return "#d97706";
    return "#ef4444";
  };

  const confidenceBg = (score: number) => {
    if (score >= 0.85) return "#d1fae5";
    if (score >= 0.7) return "#fef3c7";
    return "#fee2e2";
  };

  const imageUrl = (path: string) => `${IMG_URL}/${path.replace(/\\/g, "/")}`;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.centered}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <p style={{ color: "#64748b", marginTop: "1rem" }}>Loading case...</p>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div style={s.centered}>
        <AlertCircle size={36} style={{ color: "#ef4444" }} />
        <p style={{ color: "#64748b", marginTop: "1rem" }}>{error}</p>
        <button
          style={s.backBtn}
          onClick={() => navigate("/dermatologist/cases")}
        >
          <ArrowLeft size={14} /> Back to Queue
        </button>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={s.centered}>
        <div style={s.successRing}>
          <CheckCircle size={48} style={{ color: "#059669" }} />
        </div>
        <h2 style={s.successTitle}>Diagnosis Submitted</h2>
        <p style={{ color: "#64748b", margin: "0.5rem 0 0" }}>
          Redirecting to treatment plan...
        </p>
      </div>
    );
  }

  const age = calcAge(caseData!.patient_dob);

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button
            style={s.backBtn}
            onClick={() => navigate(`/dermatologist/case/${id}`)}
          >
            <ArrowLeft size={14} /> Back to Case Review
          </button>
          <h1 style={s.pageTitle}>AI Diagnosis Review</h1>
          <p style={s.pageSubtitle}>
            Case #{id} · {caseData!.patient_name} · Review AI prediction and
            submit your final diagnosis
          </p>
        </div>
        <div style={s.stepBadge}>
          <Brain size={14} />
          Step 2 of 3 — Diagnosis
        </div>
      </div>

      {/* ── Step progress bar ── */}
      <div style={s.progressBar}>
        {[
          { n: 1, label: "Case Review", done: true, active: false },
          { n: 2, label: "AI Diagnosis", done: false, active: true },
          { n: 3, label: "Treatment Plan", done: false, active: false },
        ].map((step, i) => (
          <React.Fragment key={step.n}>
            <div style={s.progressStep}>
              <div
                style={{
                  ...s.progressDot,
                  backgroundColor: step.done
                    ? "#059669"
                    : step.active
                    ? "#3db5e6"
                    : "#e5e7eb",
                  color: step.done || step.active ? "#fff" : "#94a3b8",
                }}
              >
                {step.done ? <CheckCircle size={12} /> : step.n}
              </div>
              <span
                style={{
                  ...s.progressLabel,
                  color: step.active ? "#1e293b" : "#94a3b8",
                  fontWeight: step.active ? 700 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div
                style={{
                  ...s.progressLine,
                  backgroundColor: step.done ? "#059669" : "#e5e7eb",
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={s.twoCol}>
        {/* ════ LEFT — Case snapshot + images ════════════════════════════ */}
        <div style={s.leftCol}>
          {/* Patient + case summary */}
          <div style={s.card}>
            <SectionHead
              icon={<User size={14} style={{ color: "#3db5e6" }} />}
              title="Patient Summary"
            />
            <div style={s.patientHero}>
              <div style={s.patientAvatar}>
                {caseData!.patient_name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <div style={s.patientName}>{caseData!.patient_name}</div>
                <div style={s.patientMeta}>
                  {age ? `${age} yrs` : "Age unknown"}
                  {caseData!.patient_sex
                    ? ` · ${
                        caseData!.patient_sex.charAt(0).toUpperCase() +
                        caseData!.patient_sex.slice(1)
                      }`
                    : ""}
                </div>
              </div>
            </div>
            <InfoRow
              label="Complaint"
              value={caseData!.chief_complaint || "—"}
            />
            <InfoRow
              label="Location"
              value={caseData!.lesion_location || "—"}
            />
            <InfoRow
              label="Duration"
              value={caseData!.lesion_duration || "—"}
            />
            <InfoRow label="Clinician" value={caseData!.clinician_name} />
            {caseData!.symptoms && (
              <div style={s.textBlock}>
                <div style={s.textBlockLabel}>Symptoms</div>
                <div style={s.textBlockValue}>{caseData!.symptoms}</div>
              </div>
            )}
            {caseData!.prior_treatment && (
              <div style={s.textBlock}>
                <div style={s.textBlockLabel}>Prior Treatment</div>
                <div style={s.textBlockValue}>{caseData!.prior_treatment}</div>
              </div>
            )}
          </div>

          {/* Lesion images */}
          <div style={s.card}>
            <SectionHead
              icon={<ImageIcon size={14} style={{ color: "#3db5e6" }} />}
              title={`Lesion Images (${images.length})`}
            />
            {images.length === 0 ? (
              <div style={s.emptyImages}>
                <ImageIcon
                  size={28}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{ color: "#9ca3af", fontSize: "0.825rem", margin: 0 }}
                >
                  No images uploaded
                </p>
              </div>
            ) : (
              <div style={s.imageGrid}>
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    style={s.imageWrap}
                    onClick={() => {
                      setLightboxIdx(idx);
                      setLightbox(true);
                    }}
                    onMouseEnter={(e) => {
                      const ov = e.currentTarget.querySelector(
                        ".ov"
                      ) as HTMLElement;
                      if (ov) ov.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      const ov = e.currentTarget.querySelector(
                        ".ov"
                      ) as HTMLElement;
                      if (ov) ov.style.opacity = "0";
                    }}
                  >
                    <img
                      src={imageUrl(img.file_path)}
                      alt={`Lesion ${idx + 1}`}
                      style={s.image}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3C/svg%3E";
                      }}
                    />
                    <div className="ov" style={s.imageOverlay}>
                      <ZoomIn size={18} style={{ color: "#fff" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT — AI result + diagnosis form ════════════════════════ */}
        <div style={s.rightCol}>
          {/* AI prediction card */}
          <div style={s.card}>
            <SectionHead
              icon={<Brain size={14} style={{ color: "#8b5cf6" }} />}
              title="AI Model Prediction"
            />

            {prediction ? (
              <>
                {/* Prediction hero */}
                <div style={s.predHero}>
                  <div
                    style={{
                      ...s.predPill,
                      backgroundColor: confidenceBg(
                        prediction.confidence_score
                      ),
                      color: confidenceColor(prediction.confidence_score),
                    }}
                  >
                    {prediction.predicted_label.charAt(0).toUpperCase() +
                      prediction.predicted_label.slice(1)}
                  </div>

                  {/* Confidence bar */}
                  <div style={s.confBarWrap}>
                    <div style={s.confBarRow}>
                      <span style={s.confLabel}>Confidence</span>
                      <span
                        style={{
                          ...s.confValue,
                          color: confidenceColor(prediction.confidence_score),
                        }}
                      >
                        {(prediction.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={s.confBarBg}>
                      <div
                        style={{
                          ...s.confBarFill,
                          width: `${prediction.confidence_score * 100}%`,
                          backgroundColor: confidenceColor(
                            prediction.confidence_score
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={s.modelMeta}>
                  <span>Model: {prediction.model_version}</span>
                  <span>·</span>
                  <span>
                    Generated:{" "}
                    {new Date(prediction.created_at).toLocaleDateString(
                      "en-GH",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </span>
                </div>

                <div style={s.aiDisclaimer}>
                  <AlertTriangle
                    size={13}
                    style={{ color: "#d97706", flexShrink: 0 }}
                  />
                  <span>
                    AI predictions are decision-support tools. Your expert
                    clinical judgement takes final precedence.
                  </span>
                </div>

                {/* Accept / Override decision */}
                <div style={s.decisionRow}>
                  <button
                    style={{
                      ...s.decisionBtn,
                      ...(aiDecision === "accept"
                        ? s.decisionAcceptActive
                        : s.decisionAccept),
                    }}
                    onClick={() => setAiDecision("accept")}
                  >
                    <ThumbsUp size={16} />
                    Accept AI Prediction
                  </button>
                  <button
                    style={{
                      ...s.decisionBtn,
                      ...(aiDecision === "override"
                        ? s.decisionOverrideActive
                        : s.decisionOverride),
                    }}
                    onClick={() => setAiDecision("override")}
                  >
                    <ThumbsDown size={16} />
                    Override Prediction
                  </button>
                </div>
              </>
            ) : (
              <div style={s.emptyImages}>
                <Brain
                  size={28}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.825rem",
                    margin: "0 0 1rem",
                  }}
                >
                  No AI prediction available — enter diagnosis manually
                </p>
                <button
                  style={{ ...s.decisionBtn, ...s.decisionOverride }}
                  onClick={() => setAiDecision("override")}
                >
                  Enter Diagnosis Manually
                </button>
              </div>
            )}
          </div>

          {/* Diagnosis form — shows after decision is made */}
          {aiDecision && (
            <div style={s.card}>
              <SectionHead
                icon={<Eye size={14} style={{ color: "#059669" }} />}
                title="Final Diagnosis"
              />

              {/* Accepted — show pre-filled, still editable */}
              {aiDecision === "accept" && (
                <div style={s.acceptedBox}>
                  <CheckCircle
                    size={16}
                    style={{ color: "#059669", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "#065f46",
                      fontWeight: 600,
                    }}
                  >
                    AI prediction accepted:{" "}
                    <strong>
                      {prediction!.predicted_label.charAt(0).toUpperCase() +
                        prediction!.predicted_label.slice(1)}
                    </strong>
                  </span>
                </div>
              )}

              {/* Override — show dropdown */}
              {aiDecision === "override" && (
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Select Final Diagnosis *</label>
                  <select
                    style={s.select}
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                  >
                    <option value="">— Choose diagnosis —</option>
                    {DIAGNOSIS_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom entry if "Other" selected */}
              {aiDecision === "override" &&
                finalDiagnosis === "Other (specify in notes)" && (
                  <div style={s.formGroup}>
                    <label style={s.formLabel}>Specify Diagnosis *</label>
                    <input
                      style={s.input}
                      placeholder="Enter diagnosis..."
                      value={customDiagnosis}
                      onChange={(e) => setCustomDiagnosis(e.target.value)}
                    />
                  </div>
                )}

              {/* Clinical notes */}
              <div style={s.formGroup}>
                <label style={s.formLabel}>
                  Clinical Notes{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  style={s.textarea}
                  rows={4}
                  placeholder="Add your clinical observations, reasoning, or additional context..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={s.errorBanner}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                style={{
                  ...s.submitBtn,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Activity size={16} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Diagnosis & Continue
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
              <p style={s.submitNote}>
                After submitting, you will be taken to write the treatment plan.
                The clinician will be notified automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && images.length > 0 && (
        <div style={s.lightboxOverlay} onClick={() => setLightbox(false)}>
          <button style={s.lightboxClose} onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          <button
            style={{ ...s.lightboxNav, left: "1.5rem" }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((i) => (i - 1 + images.length) % images.length);
            }}
          >
            ‹
          </button>
          <img
            src={imageUrl(images[lightboxIdx].file_path)}
            alt={`Image ${lightboxIdx + 1}`}
            style={s.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={{ ...s.lightboxNav, right: "1.5rem" }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((i) => (i + 1) % images.length);
            }}
          >
            ›
          </button>
          <div style={s.lightboxCounter}>
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHead({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div style={s.sectionHead}>
      {icon}
      <h3 style={s.sectionTitle}>{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "1200px", margin: "0 auto" },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    gap: "0.5rem",
  },

  // Header
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "0.825rem",
    cursor: "pointer",
    padding: 0,
  },
  pageTitle: {
    fontSize: "clamp(1.4rem, 3vw, 1.875rem)",
    fontWeight: 800,
    margin: 0,
    background: "linear-gradient(135deg, #1e293b 0%, #3db5e6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  pageSubtitle: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: 0,
    maxWidth: "520px",
  },
  stepBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#ede9fe",
    borderRadius: "10px",
    border: "1px solid #ddd6fe",
    color: "#6d28d9",
    fontSize: "0.8rem",
    fontWeight: 700,
    flexShrink: 0,
  },

  // Progress
  progressBar: {
    display: "flex",
    alignItems: "center",
    marginBottom: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "1rem 1.5rem",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  progressStep: { display: "flex", alignItems: "center", gap: "0.6rem" },
  progressDot: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  progressLabel: { fontSize: "0.825rem", whiteSpace: "nowrap" as const },
  progressLine: {
    flex: 1,
    height: "2px",
    margin: "0 0.75rem",
    minWidth: "40px",
  },

  // Layout
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1.1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  rightCol: { display: "flex", flexDirection: "column", gap: "1.25rem" },

  // Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.25rem 1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },

  // Patient
  patientHero: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },
  patientAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    flexShrink: 0,
    background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.8rem",
  },
  patientName: { fontSize: "0.9rem", fontWeight: 700, color: "#111827" },
  patientMeta: { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem" },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "0.4rem 0",
    borderBottom: "1px solid #f8fafc",
  },
  infoLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  infoValue: {
    fontSize: "0.82rem",
    color: "#111827",
    fontWeight: 500,
    textAlign: "right" as const,
  },

  textBlock: { marginTop: "0.875rem" },
  textBlockLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "0.25rem",
  },
  textBlockValue: { fontSize: "0.875rem", color: "#374151", lineHeight: 1.6 },

  // Images
  emptyImages: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 1rem",
    textAlign: "center" as const,
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.6rem",
  },
  imageWrap: {
    position: "relative" as const,
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    aspectRatio: "1",
    backgroundColor: "#f1f5f9",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },
  imageOverlay: {
    position: "absolute" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s",
  },

  // AI prediction
  predHero: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    marginBottom: "0.75rem",
    flexWrap: "wrap" as const,
  },
  predPill: {
    display: "inline-block",
    padding: "0.45rem 1.25rem",
    borderRadius: "20px",
    fontWeight: 800,
    fontSize: "1.05rem",
  },
  confBarWrap: { flex: 1, minWidth: "160px" },
  confBarRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.35rem",
  },
  confLabel: { fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 },
  confValue: { fontSize: "0.82rem", fontWeight: 800 },
  confBarBg: {
    height: "8px",
    backgroundColor: "#f1f5f9",
    borderRadius: "4px",
    overflow: "hidden",
  },
  confBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.6s ease",
  },
  modelMeta: {
    display: "flex",
    gap: "0.5rem",
    fontSize: "0.72rem",
    color: "#94a3b8",
    marginBottom: "0.75rem",
  },
  aiDisclaimer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "0.65rem 0.875rem",
    fontSize: "0.75rem",
    color: "#92400e",
    lineHeight: 1.5,
    marginBottom: "1rem",
  },

  // Decision buttons
  decisionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  decisionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "0.825rem",
    cursor: "pointer",
    border: "2px solid",
    transition: "all 0.2s",
  },
  decisionAccept: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
    color: "#166534",
  },
  decisionAcceptActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
  },
  decisionOverride: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    color: "#9a3412",
  },
  decisionOverrideActive: {
    backgroundColor: "#ea580c",
    borderColor: "#ea580c",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(234,88,12,0.3)",
  },

  // Form
  acceptedBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "10px",
    padding: "0.875rem 1rem",
    marginBottom: "1rem",
  },
  formGroup: { marginBottom: "1rem" },
  formLabel: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "0.4rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  select: {
    width: "100%",
    padding: "0.65rem 0.875rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "#f8fafc",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box" as const,
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.875rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "#f8fafc",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 0.875rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "#f8fafc",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    lineHeight: 1.6,
  },

  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    fontSize: "0.825rem",
    marginBottom: "1rem",
  },

  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.875rem",
    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "0.9rem",
    transition: "all 0.2s",
  },
  submitNote: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    textAlign: "center" as const,
    margin: "0.75rem 0 0",
    lineHeight: 1.5,
  },

  // Success
  successRing: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#d1fae5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  successTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },

  // Lightbox
  lightboxOverlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    cursor: "pointer",
  },
  lightboxImg: {
    maxWidth: "85vw",
    maxHeight: "85vh",
    objectFit: "contain" as const,
    borderRadius: "12px",
    cursor: "default",
  },
  lightboxClose: {
    position: "absolute" as const,
    top: "1.25rem",
    right: "1.25rem",
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
    zIndex: 1001,
  },
  lightboxNav: {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    color: "#fff",
    fontSize: "1.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
  },
  lightboxCounter: {
    position: "absolute" as const,
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: "0.875rem",
    fontWeight: 600,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "0.3rem 0.875rem",
    borderRadius: "20px",
  },
};
