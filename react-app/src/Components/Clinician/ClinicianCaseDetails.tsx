// src/pages/clinician/CaseDetailPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Send,
  CreditCard,
  Activity,
  AlertCircle,
  ImageIcon,
  Stethoscope,
  Pill,
  RefreshCw,
} from "lucide-react";

const API = "import.meta.env.VITE_API_URL";
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
type CaseStatus = "draft" | "sent_to_derm" | "treatment_ready" | "completed";

interface CaseDetail {
  case_id: number;
  patient_id: number;
  patient_name: string;
  patient_dob: string;
  patient_sex: string;
  patient_contact: string;
  chief_complaint: string;
  lesion_duration: string;
  lesion_location: string;
  lesion_type: string;
  symptoms: string;
  prior_treatment: string;
  vitals_json: string | null;
  image_count: number;
  status: CaseStatus;
  created_at: string;
}

interface Diagnosis {
  diagnosis_id: number;
  final_diagnosis: string;
  notes: string;
  approved_at: string;
  dermatologist_name: string;
}

interface TreatmentPlan {
  treatment_id: number;
  medications: string;
  lifestyle_advice: string;
  follow_up_instructions: string;
  generated_by: "llm" | "dermatologist";
  approved: boolean;
  created_at: string;
}

interface CaseImage {
  id: number;
  file_path: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  CaseStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
  }
> = {
  draft: {
    label: "Draft",
    color: "#64748b",
    bg: "#f1f5f9",
    icon: <Clock size={14} />,
  },
  sent_to_derm: {
    label: "Sent to Derm",
    color: "#d97706",
    bg: "#fef3c7",
    icon: <Send size={14} />,
  },
  treatment_ready: {
    label: "Treatment Ready",
    color: "#059669",
    bg: "#d1fae5",
    icon: <CheckCircle size={14} />,
  },
  completed: {
    label: "Completed",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: <CheckCircle size={14} />,
  },
};

const getTabs = (status: CaseStatus, imageCount: number) => {
  const base = [
    { key: "overview", label: "Clinical Overview" },
    { key: "images", label: `Images (${imageCount})` },
  ];
  if (status === "treatment_ready" || status === "completed") {
    base.push({ key: "diagnosis", label: "Diagnosis" });
    base.push({ key: "treatment", label: "Treatment Plan" });
  }
  return base;
};

// ─── Dynamic style functions — OUTSIDE the s object ──────────────────────────
const generatedByBadge = (by: string): React.CSSProperties => ({
  display: "inline-block",
  backgroundColor: by === "llm" ? "#ede9fe" : "#dbeafe",
  color: by === "llm" ? "#6d28d9" : "#1d4ed8",
  fontSize: "0.78rem",
  fontWeight: 600,
  padding: "0.3rem 0.75rem",
  borderRadius: "20px",
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<TreatmentPlan | null>(null);
  const [images, setImages] = useState<CaseImage[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/clinicians/cases/${caseId}`, {
        headers: auth(),
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCaseData(data.case);
      setDiagnosis(data.diagnosis || null);
      setTreatment(data.treatment || null);
      setImages(data.images || []);
    } catch {
      setError("Failed to load case details.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <div style={{ color: "#64748b", marginTop: "1rem" }}>
          Loading case...
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={s.page}>
        <div style={s.errorBanner}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error || "Case not found"}</span>
          <button style={s.retryBtn} onClick={fetchCase}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[caseData.status] ?? STATUS_CONFIG.draft;
  const tabs = getTabs(caseData.status, caseData.image_count);
  const vitals = caseData.vitals_json ? JSON.parse(caseData.vitals_json) : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button
            style={s.backBtn}
            onClick={() => navigate("/clinician/cases")}
          >
            <ArrowLeft size={16} />
            Back to Cases
          </button>
          <div>
            <h1 style={s.pageTitle}>Case #{caseData.case_id}</h1>
            <div style={s.subheader}>
              <span style={s.clinicTag}>
                <User size={12} />
                {caseData.patient_name}
              </span>
              <span style={{ color: "#94a3b8" }}>·</span>
              <span>{formatDate(caseData.created_at)}</span>
              <span style={{ color: "#94a3b8" }}>·</span>
              <span
                style={{
                  ...s.statusBadge,
                  color: sc.color,
                  backgroundColor: sc.bg,
                }}
              >
                {sc.icon}
                {sc.label}
              </span>
            </div>
          </div>
        </div>

        <div style={s.headerActions}>
          <button style={s.refreshBtn} onClick={fetchCase}>
            <RefreshCw size={14} />
          </button>
          {caseData.status === "treatment_ready" && (
            <button
              style={s.primaryBtn}
              onClick={() =>
                navigate(
                  `/clinician/billing/new?case_id=${caseData.case_id}&patient_id=${caseData.patient_id}`
                )
              }
            >
              <CreditCard size={15} />
              Proceed to Payment
            </button>
          )}
        </div>
      </div>

      {/* ── Banners ── */}
      {caseData.status === "sent_to_derm" && (
        <div style={s.yellowBanner}>
          <Send size={15} style={{ flexShrink: 0 }} />
          <span>
            This case has been submitted to the dermatologist and is currently
            under review. You will be notified when the diagnosis is ready.
          </span>
        </div>
      )}
      {caseData.status === "treatment_ready" && (
        <div style={s.greenBanner}>
          <CheckCircle size={15} style={{ flexShrink: 0 }} />
          <span>
            The dermatologist has completed their review. A diagnosis and
            treatment plan are available below. Proceed to payment to close this
            case.
          </span>
        </div>
      )}

      {/* ── Patient strip ── */}
      <div style={s.patientStrip}>
        {[
          { label: "Patient", value: caseData.patient_name },
          {
            label: "DOB",
            value: caseData.patient_dob
              ? formatDateShort(caseData.patient_dob)
              : "—",
          },
          {
            label: "Sex",
            value: caseData.patient_sex
              ? caseData.patient_sex.charAt(0).toUpperCase() +
                caseData.patient_sex.slice(1)
              : "—",
          },
          { label: "Contact", value: caseData.patient_contact || "—" },
          { label: "Location", value: caseData.lesion_location || "—" },
          { label: "Images", value: String(caseData.image_count) },
        ].map(({ label, value }) => (
          <div key={label} style={s.stripItem}>
            <span style={s.stripLabel}>{label}</span>
            <span style={s.stripValue}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabsCard}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            style={{
              ...s.tabBtn,
              ...(activeTab === key ? s.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={s.contentCard}>
        {/* Overview */}
        {activeTab === "overview" && (
          <div style={s.twoCol}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <Section
                title="Chief Complaint"
                icon={<FileText size={16} style={{ color: "#3db5e6" }} />}
              >
                <p style={s.bodyText}>{caseData.chief_complaint || "—"}</p>
              </Section>
              <Section
                title="Symptoms"
                icon={<AlertCircle size={16} style={{ color: "#f59e0b" }} />}
              >
                <p style={s.bodyText}>{caseData.symptoms || "—"}</p>
              </Section>
              <Section
                title="Prior Treatment"
                icon={<Pill size={16} style={{ color: "#8b5cf6" }} />}
              >
                <p style={s.bodyText}>
                  {caseData.prior_treatment || "None reported"}
                </p>
              </Section>
              <Section
                title="Lesion Details"
                icon={<Stethoscope size={16} style={{ color: "#059669" }} />}
              >
                <div style={s.detailGrid}>
                  <DetailItem
                    label="Type"
                    value={caseData.lesion_type || "—"}
                  />
                  <DetailItem
                    label="Location"
                    value={caseData.lesion_location || "—"}
                  />
                  <DetailItem
                    label="Duration"
                    value={caseData.lesion_duration || "—"}
                  />
                </div>
              </Section>
            </div>
            <div>
              <Section
                title="Vitals"
                icon={<Activity size={16} style={{ color: "#ef4444" }} />}
              >
                {vitals ? (
                  <div style={s.vitalsGrid}>
                    {Object.entries(vitals).map(([key, val]) => (
                      <div key={key} style={s.vitalCard}>
                        <span style={s.vitalLabel}>
                          {key.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span style={s.vitalValue}>{val as string}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={s.emptyText}>No vitals recorded for this case.</p>
                )}
              </Section>
            </div>
          </div>
        )}

        {/* Images */}
        {activeTab === "images" &&
          (images.length === 0 ? (
            <div style={s.emptyState}>
              <ImageIcon
                size={44}
                style={{ color: "#d1d5db", marginBottom: "1rem" }}
              />
              <p style={s.emptyTitle}>No images attached to this case</p>
              <p style={s.emptySub}>
                Images are uploaded during case creation.
              </p>
            </div>
          ) : (
            <div style={s.imagesGrid}>
              {images.map((img) => (
                <div key={img.id} style={s.imageCard}>
                  <img
                    src={`import.meta.env.VITE_UPLOADS_URL/${img.file_path}`}
                    alt={`Case ${caseData.case_id} image`}
                    style={s.imageEl}
                  />
                  <div style={s.imageFooter}>
                    <ImageIcon size={13} style={{ color: "#3db5e6" }} />
                    <span>Image #{img.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* Diagnosis */}
        {activeTab === "diagnosis" &&
          (diagnosis ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div style={s.dermCard}>
                <div style={s.dermAvatar}>
                  {(diagnosis.dermatologist_name?.[0] ?? "D").toUpperCase()}
                </div>
                <div>
                  <div style={s.dermName}>{diagnosis.dermatologist_name}</div>
                  <div style={s.dermMeta}>
                    Dermatologist · Reviewed{" "}
                    {formatDateShort(diagnosis.approved_at)}
                  </div>
                </div>
              </div>
              <Section
                title="Final Diagnosis"
                icon={<Stethoscope size={16} style={{ color: "#059669" }} />}
              >
                <div style={s.diagnosisPill}>
                  {diagnosis.final_diagnosis.charAt(0).toUpperCase() +
                    diagnosis.final_diagnosis.slice(1)}
                </div>
              </Section>
              <Section
                title="Dermatologist Notes"
                icon={<FileText size={16} style={{ color: "#3db5e6" }} />}
              >
                <p style={s.bodyText}>
                  {diagnosis.notes || "No additional notes provided."}
                </p>
              </Section>
            </div>
          ) : (
            <div style={s.emptyState}>
              <Stethoscope
                size={44}
                style={{ color: "#d1d5db", marginBottom: "1rem" }}
              />
              <p style={s.emptyTitle}>No diagnosis available yet</p>
              <p style={s.emptySub}>
                The dermatologist has not yet submitted a diagnosis.
              </p>
            </div>
          ))}

        {/* Treatment */}
        {activeTab === "treatment" &&
          (treatment ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div style={s.generatedByRow}>
                {/*  generatedByBadge */}
                <span style={generatedByBadge(treatment.generated_by)}>
                  {treatment.generated_by === "llm"
                    ? "AI-generated · Approved by dermatologist"
                    : "Written by dermatologist"}
                </span>
                {treatment.approved && (
                  <span style={s.approvedBadge}>
                    <CheckCircle size={13} />
                    Approved
                  </span>
                )}
              </div>
              <Section
                title="Medications"
                icon={<Pill size={16} style={{ color: "#8b5cf6" }} />}
              >
                <p style={s.bodyText}>{treatment.medications || "—"}</p>
              </Section>
              <Section
                title="Lifestyle Advice"
                icon={<CheckCircle size={16} style={{ color: "#059669" }} />}
              >
                <p style={s.bodyText}>{treatment.lifestyle_advice || "—"}</p>
              </Section>
              <Section
                title="Follow-up Instructions"
                icon={<Calendar size={16} style={{ color: "#3db5e6" }} />}
              >
                <p style={s.bodyText}>
                  {treatment.follow_up_instructions ||
                    "No follow-up instructions provided."}
                </p>
              </Section>
              {caseData.status === "treatment_ready" && (
                <button
                  style={s.paymentCta}
                  onClick={() =>
                    navigate(
                      `/clinician/billing/new?case_id=${caseData.case_id}&patient_id=${caseData.patient_id}`
                    )
                  }
                >
                  <CreditCard size={16} />
                  Proceed to Payment to Close This Case
                </button>
              )}
            </div>
          ) : (
            <div style={s.emptyState}>
              <FileText
                size={44}
                style={{ color: "#d1d5db", marginBottom: "1rem" }}
              />
              <p style={s.emptyTitle}>No treatment plan available yet</p>
              <p style={s.emptySub}>
                A treatment plan will appear here once the dermatologist
                approves one.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        {icon}
        <h3 style={s.sectionTitle}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.detailItem}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// generatedByBadge is a function above — NOT in this object
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "2rem 1.5rem",
    maxWidth: "1100px",
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
    alignItems: "flex-end",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "0.5rem" },
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
  pageTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
    fontWeight: 700,
    background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    lineHeight: 1.3,
  },
  subheader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "0.9rem",
    margin: "0.25rem 0 0 0",
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
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
  },
  headerActions: { display: "flex", gap: "0.75rem", alignItems: "center" },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.55rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    background: "white",
    color: "#374151",
    cursor: "pointer",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1.25rem",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
  },

  yellowBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "12px",
    padding: "0.875rem 1.25rem",
    fontSize: "0.875rem",
    color: "#92400e",
    marginBottom: "1.25rem",
  },
  greenBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    backgroundColor: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: "12px",
    padding: "0.875rem 1.25rem",
    fontSize: "0.875rem",
    color: "#065f46",
    marginBottom: "1.25rem",
  },

  patientStrip: {
    display: "flex",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  stripItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    padding: "1rem 1.5rem",
    borderRight: "1px solid #f1f5f9",
    flex: 1,
    minWidth: "100px",
  },
  stripLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  stripValue: { fontSize: "0.9rem", fontWeight: 600, color: "#111827" },

  tabsCard: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "1rem 1.25rem",
    border: "1px solid #e5e7eb",
    marginBottom: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  tabBtn: {
    padding: "0.55rem 1.1rem",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    backgroundColor: "transparent",
    color: "#374151",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "#3db5e6",
    color: "#ffffff",
    borderColor: "#3db5e6",
  },

  contentCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    padding: "2rem",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    minHeight: "400px",
  },
  twoCol: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "2rem" },

  section: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "1.25rem 1.5rem",
    border: "1px solid #f1f5f9",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.875rem",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  bodyText: {
    fontSize: "0.95rem",
    color: "#1e293b",
    lineHeight: 1.6,
    margin: 0,
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  detailItem: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    border: "1px solid #e5e7eb",
  },
  detailLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  detailValue: { fontSize: "0.875rem", fontWeight: 600, color: "#111827" },

  vitalsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem",
  },
  vitalCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  vitalLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
  },
  vitalValue: { fontSize: "0.95rem", fontWeight: 700, color: "#111827" },

  imagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
  },
  imageCard: {
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  imageEl: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    display: "block",
  },
  imageFooter: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 0.875rem",
    backgroundColor: "#f8fafc",
    fontSize: "0.78rem",
    color: "#64748b",
    fontWeight: 500,
  },

  dermCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.25rem 1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  dermAvatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "#3db5e6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    flexShrink: 0,
  },
  dermName: { fontWeight: 600, color: "#111827", fontSize: "0.95rem" },
  dermMeta: { fontSize: "0.8rem", color: "#64748b" },
  diagnosisPill: {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontWeight: 700,
    fontSize: "1.1rem",
    padding: "0.5rem 1.25rem",
    borderRadius: "20px",
  },

  generatedByRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  // generatedByBadge is a standalone function above — NOT here
  approvedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: "#d1fae5",
    color: "#059669",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
  },
  paymentCta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "1rem",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 2rem",
    textAlign: "center",
  },
  emptyTitle: {
    fontWeight: 600,
    color: "#374151",
    fontSize: "1rem",
    margin: "0 0 0.5rem 0",
  },
  emptySub: { fontSize: "0.875rem", color: "#9ca3af", margin: 0 },
  emptyText: {
    color: "#9ca3af",
    fontSize: "0.875rem",
    fontStyle: "italic",
    margin: 0,
  },
};
