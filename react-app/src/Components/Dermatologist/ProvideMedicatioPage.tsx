// src/Components/Dermatologist/ProvideMedicationPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Activity,
  Pill,
  FileText,
  User,
  Stethoscope,
  Sparkles,
  Edit3,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

const API = "import.meta.env.VITE_API_URL";
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
  symptoms: string | null;
  prior_treatment: string | null;
  clinician_name: string;
}

interface Diagnosis {
  diagnosis_id: number;
  final_diagnosis: string;
  notes: string | null;
}

interface AISuggestion {
  medications: string;
  lifestyle_advice: string;
  follow_up_instructions: string;
}

export default function ProvideMedicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Treatment form state ──────────────────────────────────────────────────
  const [medications, setMedications] = useState("");
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [generatedBy, setGeneratedBy] = useState<"dermatologist" | "llm">(
    "dermatologist"
  );

  // ── AI suggestion state ───────────────────────────────────────────────────
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);

  // ── Fetch case + diagnosis ────────────────────────────────────────────────
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
      setDiagnosis(data.diagnosis || null);

      // If treatment already exists redirect back
      if (data.treatment) {
        navigate(`/dermatologist/case/${id}`, { replace: true });
        return;
      }

      // If no diagnosis yet redirect to diagnosis page
      if (!data.diagnosis) {
        navigate(`/dermatologist/diagnosis/${id}`, { replace: true });
        return;
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

  // ── Generate AI treatment plan via OpenAI ─────────────────────────────────
  const generateAIPlan = async () => {
    if (!caseData || !diagnosis) return;
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/dermatologists/cases/${id}/ai-treatment`,
        {
          method: "POST",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({
            diagnosis: diagnosis.final_diagnosis,
            symptoms: caseData.symptoms || "",
            prior_treatment: caseData.prior_treatment || "",
            lesion_location: caseData.lesion_location || "",
            patient_sex: caseData.patient_sex || "",
            patient_age: calcAge(caseData.patient_dob),
          }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "AI generation failed");
      }
      const data: AISuggestion = await res.json();
      setAiSuggestion(data);
      setShowAiPreview(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI treatment plan.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Apply AI suggestion to form ───────────────────────────────────────────
  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    setMedications(aiSuggestion.medications);
    setLifestyleAdvice(aiSuggestion.lifestyle_advice);
    setFollowUpInstructions(aiSuggestion.follow_up_instructions);
    setGeneratedBy("llm");
    setShowAiPreview(false);
  };

  // ── Submit treatment plan ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!medications.trim()) {
      setError("Medications field is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/dermatologists/cases/${id}/treatment`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: medications.trim(),
          lifestyle_advice: lifestyleAdvice.trim() || null,
          follow_up_instructions: followUpInstructions.trim() || null,
          generated_by: generatedBy,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Submission failed");
      }
      setSuccess(true);
      setTimeout(() => navigate(`/dermatologist/cases`), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit treatment plan.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
  };

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
        <h2 style={s.successTitle}>Treatment Plan Submitted</h2>
        <p
          style={{
            color: "#64748b",
            margin: "0.5rem 0 0",
            textAlign: "center",
          }}
        >
          The clinician has been notified. Returning to case queue...
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
          <h1 style={s.pageTitle}>Treatment Plan</h1>
          <p style={s.pageSubtitle}>
            Case #{id} · {caseData!.patient_name} · Write or generate a
            treatment plan for the diagnosed condition
          </p>
        </div>
        <div style={s.stepBadge}>
          <Pill size={14} />
          Step 3 of 3 — Treatment
        </div>
      </div>

      {/* ── Step progress bar ── */}
      <div style={s.progressBar}>
        {[
          { n: 1, label: "Case Review", done: true, active: false },
          { n: 2, label: "AI Diagnosis", done: true, active: false },
          { n: 3, label: "Treatment Plan", done: false, active: true },
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
        {/* ════ LEFT — Case & diagnosis summary ═══════════════════════════ */}
        <div style={s.leftCol}>
          {/* Patient summary */}
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

          {/* Confirmed diagnosis */}
          <div style={s.card}>
            <SectionHead
              icon={<CheckCircle size={14} style={{ color: "#059669" }} />}
              title="Confirmed Diagnosis"
            />
            <div style={s.diagnosisPill}>
              {diagnosis!.final_diagnosis.charAt(0).toUpperCase() +
                diagnosis!.final_diagnosis.slice(1)}
            </div>
            {diagnosis!.notes && (
              <div style={{ ...s.textBlock, marginTop: "1rem" }}>
                <div style={s.textBlockLabel}>Clinical Notes</div>
                <div style={s.textBlockValue}>{diagnosis!.notes}</div>
              </div>
            )}
          </div>

          {/* AI generate button */}
          <div style={s.aiCard}>
            <div style={s.aiCardHeader}>
              <div style={s.aiCardIcon}>
                <Sparkles size={20} style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <div style={s.aiCardTitle}>AI Treatment Suggestion</div>
                <div style={s.aiCardSub}>
                  Powered by OpenAI · Based on diagnosis &amp; patient data
                </div>
              </div>
            </div>
            <p style={s.aiCardDesc}>
              Generate a treatment plan suggestion for{" "}
              <strong>{diagnosis!.final_diagnosis}</strong> using AI. You can
              review, edit, and personalise before submitting.
            </p>
            <button
              style={{
                ...s.aiGenerateBtn,
                opacity: aiLoading ? 0.75 : 1,
                cursor: aiLoading ? "not-allowed" : "pointer",
              }}
              onClick={generateAIPlan}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <>
                  <Activity size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate AI Plan
                </>
              )}
            </button>
          </div>
        </div>

        {/* ════ RIGHT — Treatment form ════════════════════════════════════ */}
        <div style={s.rightCol}>
          <div style={s.card}>
            <div style={s.formCardHeader}>
              <SectionHead
                icon={<Edit3 size={14} style={{ color: "#d97706" }} />}
                title="Treatment Plan Details"
              />
              {generatedBy === "llm" && (
                <div style={s.aiBadge}>
                  <Sparkles size={11} />
                  AI Generated
                </div>
              )}
            </div>

            {/* Medications */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>Medications &amp; Dosage *</label>
              <p style={s.formHint}>
                Include drug name, strength, dosage form, and frequency
              </p>
              <textarea
                style={s.textarea}
                rows={5}
                placeholder={
                  "e.g.\n" +
                  "1. Betamethasone 0.1% cream — apply twice daily for 2 weeks\n" +
                  "2. Cetirizine 10mg — once daily for 7 days\n" +
                  "3. Emollient cream — apply as needed for dryness"
                }
                value={medications}
                onChange={(e) => {
                  setMedications(e.target.value);
                  setGeneratedBy("dermatologist");
                }}
              />
            </div>

            {/* Lifestyle advice */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>
                Lifestyle Advice{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <p style={s.formHint}>
                Diet, hygiene, sun exposure, triggers to avoid
              </p>
              <textarea
                style={s.textarea}
                rows={4}
                placeholder={
                  "e.g.\n" +
                  "- Avoid prolonged sun exposure, use SPF 50+\n" +
                  "- Wear loose, breathable cotton clothing\n" +
                  "- Avoid known allergens and fragranced products"
                }
                value={lifestyleAdvice}
                onChange={(e) => {
                  setLifestyleAdvice(e.target.value);
                  setGeneratedBy("dermatologist");
                }}
              />
            </div>

            {/* Follow-up */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>
                Follow-up Instructions{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <p style={s.formHint}>
                Review timeline, red flags, when to escalate
              </p>
              <textarea
                style={s.textarea}
                rows={3}
                placeholder={
                  "e.g.\n" +
                  "- Review in 2 weeks if no improvement\n" +
                  "- Return immediately if lesion spreads or bleeds\n" +
                  "- Biopsy recommended if no response to treatment"
                }
                value={followUpInstructions}
                onChange={(e) => {
                  setFollowUpInstructions(e.target.value);
                  setGeneratedBy("dermatologist");
                }}
              />
            </div>

            {/* Source indicator */}
            <div style={s.sourceRow}>
              <div
                style={{
                  ...s.sourceDot,
                  backgroundColor:
                    generatedBy === "llm" ? "#8b5cf6" : "#3db5e6",
                }}
              />
              <span style={s.sourceLabel}>
                {generatedBy === "llm"
                  ? "AI-generated plan (review before submitting)"
                  : "Dermatologist-authored plan"}
              </span>
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
                opacity: submitting ? 0.75 : 1,
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
                  <Send size={16} />
                  Submit Treatment Plan
                  <ChevronRight size={14} />
                </>
              )}
            </button>

            <p style={s.submitNote}>
              The clinician will be notified immediately after submission. The
              patient's case status will update to{" "}
              <strong>Treatment Ready</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── AI Suggestion Preview Modal ── */}
      {showAiPreview && aiSuggestion && (
        <div style={s.modalOverlay} onClick={() => setShowAiPreview(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitleRow}>
                <div style={s.modalIcon}>
                  <Sparkles size={18} style={{ color: "#8b5cf6" }} />
                </div>
                <div>
                  <h2 style={s.modalTitle}>AI Treatment Suggestion</h2>
                  <p style={s.modalSub}>
                    Review and apply to the treatment form
                  </p>
                </div>
              </div>
              <button
                style={s.modalClose}
                onClick={() => setShowAiPreview(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={s.aiSection}>
                <div style={s.aiSectionLabel}>
                  <Pill size={13} style={{ color: "#8b5cf6" }} />
                  Medications &amp; Dosage
                </div>
                <div style={s.aiSectionValue}>{aiSuggestion.medications}</div>
              </div>

              <div style={s.aiSection}>
                <div style={s.aiSectionLabel}>
                  <Stethoscope size={13} style={{ color: "#8b5cf6" }} />
                  Lifestyle Advice
                </div>
                <div style={s.aiSectionValue}>
                  {aiSuggestion.lifestyle_advice}
                </div>
              </div>

              <div style={s.aiSection}>
                <div style={s.aiSectionLabel}>
                  <FileText size={13} style={{ color: "#8b5cf6" }} />
                  Follow-up Instructions
                </div>
                <div style={s.aiSectionValue}>
                  {aiSuggestion.follow_up_instructions}
                </div>
              </div>

              <div style={s.aiDisclaimer}>
                <AlertCircle
                  size={13}
                  style={{ color: "#d97706", flexShrink: 0 }}
                />
                <span>
                  This suggestion is AI-generated based on the diagnosis and
                  patient context. Review and edit before finalising — you are
                  responsible for the final treatment plan.
                </span>
              </div>
            </div>

            <div style={s.modalFooter}>
              <button
                style={s.modalDiscard}
                onClick={() => setShowAiPreview(false)}
              >
                Discard
              </button>
              <button
                style={s.modalRegenerate}
                onClick={() => {
                  setShowAiPreview(false);
                  generateAIPlan();
                }}
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
              <button style={s.modalApply} onClick={applyAISuggestion}>
                <CheckCircle size={14} />
                Apply to Form
              </button>
            </div>
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
    backgroundColor: "#fef3c7",
    borderRadius: "10px",
    border: "1px solid #fde68a",
    color: "#92400e",
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
    gridTemplateColumns: "1fr 1.2fr",
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

  // Diagnosis pill
  diagnosisPill: {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontWeight: 800,
    fontSize: "1rem",
    padding: "0.4rem 1.25rem",
    borderRadius: "20px",
    border: "1px solid #6ee7b7",
  },

  // AI card
  aiCard: {
    backgroundColor: "#faf5ff",
    borderRadius: "16px",
    border: "1px solid #e9d5ff",
    padding: "1.25rem 1.5rem",
  },
  aiCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.875rem",
    marginBottom: "0.875rem",
  },
  aiCardIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiCardTitle: { fontSize: "0.9rem", fontWeight: 700, color: "#5b21b6" },
  aiCardSub: { fontSize: "0.72rem", color: "#8b5cf6", marginTop: "0.15rem" },
  aiCardDesc: {
    fontSize: "0.825rem",
    color: "#6d28d9",
    lineHeight: 1.6,
    margin: "0 0 1rem",
  },
  aiGenerateBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem",
    background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },

  // Form
  formCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: "#ede9fe",
    color: "#6d28d9",
    padding: "0.2rem 0.6rem",
    borderRadius: "10px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  formGroup: { marginBottom: "1.25rem" },
  formLabel: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "0.2rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  formHint: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    margin: "0 0 0.5rem",
    lineHeight: 1.4,
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

  sourceRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  sourceDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  sourceLabel: { fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" },

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
    background: "linear-gradient(135deg, #3db5e6 0%, #1e88d4 100%)",
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

  // Modal
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "600px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "1.5rem",
    borderBottom: "1px solid #f1f5f9",
    background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)",
  },
  modalTitleRow: { display: "flex", alignItems: "flex-start", gap: "0.875rem" },
  modalIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#5b21b6",
    margin: 0,
  },
  modalSub: { fontSize: "0.775rem", color: "#8b5cf6", margin: "0.2rem 0 0" },
  modalClose: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "0.25rem",
    flexShrink: 0,
  },
  modalBody: {
    padding: "1.5rem",
    maxHeight: "55vh",
    overflowY: "auto" as const,
  },
  aiSection: { marginBottom: "1.25rem" },
  aiSectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#8b5cf6",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
  },
  aiSectionValue: {
    fontSize: "0.875rem",
    color: "#374151",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap" as const,
    backgroundColor: "#faf5ff",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    border: "1px solid #e9d5ff",
  },
  aiDisclaimer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "0.75rem 0.875rem",
    fontSize: "0.75rem",
    color: "#92400e",
    lineHeight: 1.5,
    marginTop: "1rem",
  },
  modalFooter: {
    display: "flex",
    gap: "0.75rem",
    padding: "1.25rem 1.5rem",
    borderTop: "1px solid #f1f5f9",
    justifyContent: "flex-end",
  },
  modalDiscard: {
    padding: "0.65rem 1.25rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#64748b",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  modalRegenerate: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    border: "1px solid #e9d5ff",
    borderRadius: "10px",
    backgroundColor: "#faf5ff",
    color: "#6d28d9",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  modalApply: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};
