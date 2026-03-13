// src/Components/Dermatologist/CaseReviewPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  ImageIcon,
  Stethoscope,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  ZoomIn,
  X,
  Calendar,
  MapPin,
  Pill,
  ClipboardList,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}`;
const IMG_URL = import.meta.env.VITE_UPLOADS_URL; // to serve images from backend uploads folder, which may be different from API URL in production (e.g. using a CDN or separate media server)
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface CaseDetail {
  case_id: number;
  patient_id: number;
  patient_name: string;
  patient_dob: string | null;
  patient_sex: string | null;
  patient_contact: string | null;
  chief_complaint: string;
  lesion_location: string;
  lesion_type: string | null;
  lesion_duration: string | null;
  symptoms: string | null;
  prior_treatment: string | null;
  image_count: number;
  status: string;
  created_at: string;
  clinician_name: string;
  vitals_json: any;
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

interface Diagnosis {
  diagnosis_id: number;
  final_diagnosis: string;
  notes: string | null;
  approved_at: string;
  dermatologist_name: string;
}

interface Treatment {
  treatment_id: number;
  medications: string;
  lifestyle_advice: string | null;
  follow_up_instructions: string | null;
  generated_by: string;
}

export default function CaseReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [images, setImages] = useState<CaseImage[]>([]);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setDiagnosis(data.diagnosis || null);
      setTreatment(data.treatment || null);
    } catch {
      setError("Failed to load case details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
    });

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

  const imageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const cleanedPath = path.replace(/\\/g, "/");

    // If backend already sent an absolute path starting with `/`
    if (cleanedPath.startsWith("/")) {
      return `${IMG_URL?.replace(/\/$/, "")}${cleanedPath}`;
    }

    // For relative paths like `uploads/foo.png` or `foo.png`
    return `${IMG_URL?.replace(/\/$/, "")}/${cleanedPath}`;
  };

  const vitals = caseData?.vitals_json
    ? typeof caseData.vitals_json === "string"
      ? JSON.parse(caseData.vitals_json)
      : caseData.vitals_json
    : null;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <p style={{ color: "#64748b", marginTop: "1rem" }}>Loading case...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={s.loadingContainer}>
        <AlertCircle size={36} style={{ color: "#ef4444" }} />
        <p style={{ color: "#64748b", marginTop: "1rem" }}>
          {error || "Case not found"}
        </p>
        <button
          style={s.backBtn}
          onClick={() => navigate("/dermatologist/cases")}
        >
          <ArrowLeft size={14} /> Back to Queue
        </button>
      </div>
    );
  }

  const age = calcAge(caseData.patient_dob);
  const isReviewed = !!diagnosis;
  const hasTreatment = !!treatment;

  return (
    <div style={s.page}>
      {/* ── Page header ── */}
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button
            style={s.backBtn}
            onClick={() => navigate("/dermatologist/cases")}
          >
            <ArrowLeft size={14} /> Back to Queue
          </button>
          <h1 style={s.pageTitle}>Case Review</h1>
          <p style={s.pageSubtitle}>
            Case #{caseData.case_id} · {caseData.patient_name}
          </p>
        </div>

        {/* Status + action */}
        <div style={s.headerActions}>
          <div
            style={{
              ...s.statusChip,
              backgroundColor: isReviewed ? "#d1fae5" : "#fee2e2",
              color: isReviewed ? "#065f46" : "#991b1b",
              borderColor: isReviewed ? "#6ee7b7" : "#fca5a5",
            }}
          >
            {isReviewed ? <CheckCircle size={13} /> : <Clock size={13} />}
            {isReviewed ? "Reviewed" : "Pending Review"}
          </div>

          {/* CTA based on workflow stage */}
          {!isReviewed && (
            <button
              style={s.primaryBtn}
              onClick={() =>
                navigate(`/dermatologist/diagnosis/${caseData.case_id}`)
              }
            >
              <Brain size={15} />
              Review AI & Diagnose
              <ChevronRight size={14} />
            </button>
          )}
          {isReviewed && !hasTreatment && (
            <button
              style={s.primaryBtn}
              onClick={() =>
                navigate(`/dermatologist/treatment/${caseData.case_id}`)
              }
            >
              <Pill size={15} />
              Write Treatment Plan
              <ChevronRight size={14} />
            </button>
          )}
          {isReviewed && hasTreatment && (
            <div style={s.completedChip}>
              <CheckCircle size={13} />
              Treatment Plan Done
            </div>
          )}
        </div>
      </div>

      {/* ── Three column layout ── */}
      <div style={s.threeCol}>
        {/* ════ LEFT — Patient & case info ════════════════════════════════ */}
        <div style={s.leftCol}>
          {/* Patient card */}
          <div style={s.card}>
            <SectionHead
              icon={<User size={14} style={{ color: "#3db5e6" }} />}
              title="Patient Information"
            />
            <div style={s.patientHero}>
              <div style={s.patientAvatar}>
                {caseData.patient_name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <div style={s.patientName}>{caseData.patient_name}</div>
                <div style={s.patientMeta}>
                  {age ? `${age} years old` : "Age unknown"}
                  {caseData.patient_sex
                    ? ` · ${
                        caseData.patient_sex.charAt(0).toUpperCase() +
                        caseData.patient_sex.slice(1)
                      }`
                    : ""}
                </div>
              </div>
            </div>
            <InfoRow label="Contact" value={caseData.patient_contact || "—"} />
            <InfoRow
              label="Date of Birth"
              value={
                caseData.patient_dob ? formatDate(caseData.patient_dob) : "—"
              }
            />
          </div>

          {/* Case details card */}
          <div style={s.card}>
            <SectionHead
              icon={<ClipboardList size={14} style={{ color: "#8b5cf6" }} />}
              title="Case Details"
            />
            <InfoRow label="Case ID" value={`#${caseData.case_id}`} />
            <InfoRow
              label="Submitted"
              value={`${formatDate(caseData.created_at)} at ${formatTime(
                caseData.created_at
              )}`}
            />
            <InfoRow label="Clinician" value={caseData.clinician_name} />
            <InfoRow
              label="Complaint"
              value={caseData.chief_complaint || "—"}
            />
            <InfoRow label="Duration" value={caseData.lesion_duration || "—"} />
            <InfoRow label="Location" value={caseData.lesion_location || "—"} />
            <InfoRow label="Lesion Type" value={caseData.lesion_type || "—"} />
          </div>

          {/* Symptoms card */}
          {(caseData.symptoms || caseData.prior_treatment) && (
            <div style={s.card}>
              <SectionHead
                icon={<Stethoscope size={14} style={{ color: "#059669" }} />}
                title="Clinical History"
              />
              {caseData.symptoms && (
                <div style={s.textBlock}>
                  <div style={s.textBlockLabel}>Symptoms</div>
                  <div style={s.textBlockValue}>{caseData.symptoms}</div>
                </div>
              )}
              {caseData.prior_treatment && (
                <div style={s.textBlock}>
                  <div style={s.textBlockLabel}>Prior Treatment</div>
                  <div style={s.textBlockValue}>{caseData.prior_treatment}</div>
                </div>
              )}
            </div>
          )}

          {/* Vitals */}
          {vitals && Object.keys(vitals).length > 0 && (
            <div style={s.card}>
              <SectionHead
                icon={<Activity size={14} style={{ color: "#ef4444" }} />}
                title="Vitals"
              />
              <div style={s.vitalsGrid}>
                {vitals.bp && (
                  <div style={s.vitalItem}>
                    <div style={s.vitalLabel}>Blood Pressure</div>
                    <div style={s.vitalValue}>{vitals.bp}</div>
                  </div>
                )}
                {vitals.temp && (
                  <div style={s.vitalItem}>
                    <div style={s.vitalLabel}>Temperature</div>
                    <div style={s.vitalValue}>{vitals.temp}</div>
                  </div>
                )}
                {vitals.weight && (
                  <div style={s.vitalItem}>
                    <div style={s.vitalLabel}>Weight</div>
                    <div style={s.vitalValue}>{vitals.weight}</div>
                  </div>
                )}
                {vitals.pulse && (
                  <div style={s.vitalItem}>
                    <div style={s.vitalLabel}>Pulse</div>
                    <div style={s.vitalValue}>{vitals.pulse}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ════ MIDDLE — Images ════════════════════════════════════════════ */}
        <div style={s.middleCol}>
          <div style={s.card}>
            <SectionHead
              icon={<ImageIcon size={14} style={{ color: "#3db5e6" }} />}
              title={`Lesion Images (${images.length})`}
            />

            {images.length === 0 ? (
              <div style={s.noImages}>
                <ImageIcon
                  size={32}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}
                >
                  No images uploaded for this case
                </p>
              </div>
            ) : (
              <div style={s.imageGrid}>
                {images.map((img, idx) => {
                  const src = imageUrl(img.file_path);
                  console.log("DERM IMAGE SRC", idx, src, img.file_path);
                  return (
                    <div
                      key={img.id}
                      style={s.imageWrap}
                      onClick={() => {
                        setLightboxIdx(idx);
                        setLightbox(true);
                      }}
                      onMouseEnter={(e) => {
                        const overlay = e.currentTarget.querySelector(
                          ".img-overlay"
                        ) as HTMLElement;
                        if (overlay) overlay.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        const overlay = e.currentTarget.querySelector(
                          ".img-overlay"
                        ) as HTMLElement;
                        if (overlay) overlay.style.opacity = "0";
                      }}
                    >
                      <img
                        src={src}
                        alt={`Lesion ${idx + 1}`}
                        style={s.image}
                        onError={(e) => {
                          console.error("IMG ERROR for", src);
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3C/svg%3E";
                        }}
                        // to be removed once we have proper image URLs from backend in production, currently needed to handle local file paths from backend during development which cannot be loaded directly in the img tag
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "0.25rem",
                          right: "0.25rem",
                          fontSize: "0.55rem",
                          color: "#f97316",
                          background: "rgba(0,0,0,0.6)",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          maxWidth: "90%",
                          wordBreak: "break-all",
                        }}
                      />
                      <div className="img-overlay" style={s.imageOverlay}>
                        <ZoomIn size={20} style={{ color: "#fff" }} />
                      </div>
                      <div style={s.imageLabel}>Image {idx + 1}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Prediction card */}
          {prediction && (
            <div style={s.card}>
              <SectionHead
                icon={<Brain size={14} style={{ color: "#8b5cf6" }} />}
                title="AI Prediction"
              />
              <div style={s.aiHero}>
                <div
                  style={{
                    ...s.aiPredPill,
                    backgroundColor: confidenceBg(prediction.confidence_score),
                    color: confidenceColor(prediction.confidence_score),
                  }}
                >
                  {prediction.predicted_label.charAt(0).toUpperCase() +
                    prediction.predicted_label.slice(1)}
                </div>
                <div
                  style={{
                    ...s.aiConfidence,
                    color: confidenceColor(prediction.confidence_score),
                  }}
                >
                  {(prediction.confidence_score * 100).toFixed(1)}% confidence
                </div>
              </div>
              <div style={s.aiMeta}>
                <span>Model: {prediction.model_version}</span>
                <span>·</span>
                <span>{formatDate(prediction.created_at)}</span>
              </div>
              <div style={s.aiNote}>
                <AlertCircle
                  size={13}
                  style={{ color: "#d97706", flexShrink: 0 }}
                />
                <span>
                  AI predictions assist clinical decision-making and should be
                  verified by a certified dermatologist before finalising.
                </span>
              </div>
            </div>
          )}

          {!prediction && (
            <div style={s.card}>
              <SectionHead
                icon={<Brain size={14} style={{ color: "#94a3b8" }} />}
                title="AI Prediction"
              />
              <div style={s.noImages}>
                <Brain
                  size={28}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}
                >
                  No AI prediction available for this case
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT — Diagnosis & treatment ═════════════════════════════ */}
        <div style={s.rightCol}>
          {/* Diagnosis result */}
          <div style={s.card}>
            <SectionHead
              icon={<Eye size={14} style={{ color: "#059669" }} />}
              title="Dermatologist Diagnosis"
            />
            {isReviewed ? (
              <>
                <div style={s.diagnosisPill}>
                  {diagnosis!.final_diagnosis.charAt(0).toUpperCase() +
                    diagnosis!.final_diagnosis.slice(1)}
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <InfoRow
                    label="Reviewed by"
                    value={diagnosis!.dermatologist_name}
                  />
                  <InfoRow
                    label="Date"
                    value={formatDate(diagnosis!.approved_at)}
                  />
                </div>
                {diagnosis!.notes && (
                  <div style={s.textBlock}>
                    <div style={s.textBlockLabel}>Clinical Notes</div>
                    <div style={s.textBlockValue}>{diagnosis!.notes}</div>
                  </div>
                )}
                {!hasTreatment && (
                  <button
                    style={s.outlineBtn}
                    onClick={() =>
                      navigate(`/dermatologist/treatment/${caseData.case_id}`)
                    }
                  >
                    <Pill size={14} />
                    Write Treatment Plan
                  </button>
                )}
              </>
            ) : (
              <div style={s.pendingBox}>
                <Clock
                  size={28}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.875rem",
                    margin: "0 0 1rem",
                  }}
                >
                  Diagnosis not yet submitted
                </p>
                <button
                  style={s.primaryBtn}
                  onClick={() =>
                    navigate(`/dermatologist/diagnosis/${caseData.case_id}`)
                  }
                >
                  <Brain size={14} />
                  Start Diagnosis Review
                </button>
              </div>
            )}
          </div>

          {/* Treatment plan */}
          <div style={s.card}>
            <SectionHead
              icon={<Pill size={14} style={{ color: "#d97706" }} />}
              title="Treatment Plan"
            />
            {hasTreatment ? (
              <>
                <div style={s.textBlock}>
                  <div style={s.textBlockLabel}>Medications</div>
                  <div style={s.textBlockValue}>{treatment!.medications}</div>
                </div>
                {treatment!.lifestyle_advice && (
                  <div style={s.textBlock}>
                    <div style={s.textBlockLabel}>Lifestyle Advice</div>
                    <div style={s.textBlockValue}>
                      {treatment!.lifestyle_advice}
                    </div>
                  </div>
                )}
                {treatment!.follow_up_instructions && (
                  <div style={s.textBlock}>
                    <div style={s.textBlockLabel}>Follow-up Instructions</div>
                    <div style={s.textBlockValue}>
                      {treatment!.follow_up_instructions}
                    </div>
                  </div>
                )}
                <div style={s.generatedByBadge}>
                  {treatment!.generated_by === "llm"
                    ? "🤖 AI Generated"
                    : "✍️ Dermatologist Written"}
                </div>
              </>
            ) : (
              <div style={s.pendingBox}>
                <Pill
                  size={28}
                  style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
                />
                <p
                  style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}
                >
                  {isReviewed
                    ? "Diagnosis submitted — treatment plan not yet written"
                    : "Complete diagnosis first before writing a treatment plan"}
                </p>
              </div>
            )}
          </div>

          {/* Workflow tracker */}
          <div style={s.card}>
            <SectionHead
              icon={<FileText size={14} style={{ color: "#94a3b8" }} />}
              title="Case Workflow"
            />
            {[
              { label: "Case submitted by clinician", done: true },
              { label: "AI prediction generated", done: !!prediction },
              { label: "Dermatologist diagnosis", done: isReviewed },
              { label: "Treatment plan written", done: hasTreatment },
              { label: "Clinician notified", done: hasTreatment },
            ].map((step, i) => (
              <div key={i} style={s.workflowStep}>
                <div
                  style={{
                    ...s.workflowDot,
                    backgroundColor: step.done ? "#059669" : "#e5e7eb",
                    borderColor: step.done ? "#059669" : "#d1d5db",
                  }}
                >
                  {step.done && (
                    <CheckCircle size={10} style={{ color: "#fff" }} />
                  )}
                </div>
                <span
                  style={{
                    ...s.workflowLabel,
                    color: step.done ? "#111827" : "#94a3b8",
                    fontWeight: step.done ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && images.length > 0 && (
        <div style={s.lightboxOverlay} onClick={() => setLightbox(false)}>
          <button style={s.lightboxClose} onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          <button
            style={{ ...s.lightboxNav, left: "1rem" }}
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
            style={{ ...s.lightboxNav, right: "1rem" }}
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
  page: { maxWidth: "1300px", margin: "0 auto" },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
  },

  // Header
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.75rem",
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
    marginBottom: "0.25rem",
  },
  pageTitle: {
    fontSize: "clamp(1.4rem, 3vw, 1.875rem)",
    fontWeight: 800,
    margin: 0,
    background: "linear-gradient(135deg, #1e293b 0%, #3db5e6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  pageSubtitle: { fontSize: "0.875rem", color: "#64748b", margin: 0 },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },

  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.875rem",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 1.25rem",
    background: "linear-gradient(135deg, #3db5e6 0%, #1e88d4 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  outlineBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.65rem",
    border: "1.5px solid #3db5e6",
    borderRadius: "10px",
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
    marginTop: "1rem",
  },
  completedChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.875rem",
    borderRadius: "20px",
    backgroundColor: "#d1fae5",
    border: "1px solid #6ee7b7",
    color: "#065f46",
    fontSize: "0.8rem",
    fontWeight: 600,
  },

  // Layout
  threeCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  middleCol: { display: "flex", flexDirection: "column", gap: "1.25rem" },
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
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  // Patient
  patientHero: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    marginBottom: "1rem",
    padding: "0.875rem",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
  },
  patientAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    flexShrink: 0,
    background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.875rem",
  },
  patientName: { fontSize: "0.95rem", fontWeight: 700, color: "#111827" },
  patientMeta: { fontSize: "0.775rem", color: "#94a3b8", marginTop: "0.1rem" },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "0.45rem 0",
    borderBottom: "1px solid #f8fafc",
  },
  infoLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  infoValue: {
    fontSize: "0.825rem",
    color: "#111827",
    fontWeight: 500,
    textAlign: "right",
  },

  textBlock: { marginBottom: "0.875rem" },
  textBlockLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.25rem",
  },
  textBlockValue: { fontSize: "0.875rem", color: "#374151", lineHeight: 1.6 },

  vitalsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
  vitalItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "0.75rem",
    border: "1px solid #e5e7eb",
  },
  vitalLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.2rem",
  },
  vitalValue: { fontSize: "1rem", fontWeight: 700, color: "#111827" },

  // Images
  noImages: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 1rem",
    textAlign: "center",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem",
  },
  imageWrap: {
    position: "relative",
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "pointer",
    aspectRatio: "1",
    backgroundColor: "#f1f5f9",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imageOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s",
  },
  imageLabel: {
    position: "absolute",
    bottom: "0.4rem",
    left: "0.5rem",
    fontSize: "0.65rem",
    color: "#fff",
    fontWeight: 600,
    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
  },

  // AI
  aiHero: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "0.75rem",
  },
  aiPredPill: {
    display: "inline-block",
    padding: "0.4rem 1.25rem",
    borderRadius: "20px",
    fontWeight: 800,
    fontSize: "1rem",
  },
  aiConfidence: { fontSize: "1.1rem", fontWeight: 800 },
  aiMeta: {
    display: "flex",
    gap: "0.5rem",
    fontSize: "0.72rem",
    color: "#94a3b8",
    marginBottom: "0.75rem",
  },
  aiNote: {
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
  },

  // Diagnosis
  diagnosisPill: {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontWeight: 800,
    fontSize: "1rem",
    padding: "0.4rem 1.25rem",
    borderRadius: "20px",
  },
  generatedByBadge: {
    marginTop: "0.75rem",
    fontSize: "0.75rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  pendingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1.5rem 1rem",
    textAlign: "center",
  },

  // Workflow
  workflowStep: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f8fafc",
  },
  workflowDot: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  workflowLabel: { fontSize: "0.825rem" },

  // Lightbox
  lightboxOverlay: {
    position: "fixed",
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
    objectFit: "contain",
    borderRadius: "12px",
    cursor: "default",
  },
  lightboxClose: {
    position: "absolute",
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
    position: "absolute",
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
    position: "absolute",
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
