// src/Components/Clinician/BillingPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Activity,
  Printer,
  Receipt,
  Stethoscope,
  Pill,
  FileText,
  User,
  CreditCard,
  ShieldCheck,
  Search,
  ChevronRight,
  Users,
} from "lucide-react";

const API = "import.meta.env.VITE_API_URL";
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface CaseSummary {
  case_id: number;
  patient_id: number;
  patient_name: string;
  patient_contact: string;
  chief_complaint: string;
  status: string;
}

interface DiagnosisSummary {
  final_diagnosis: string;
  dermatologist_name: string;
  approved_at: string;
}

interface TreatmentSummary {
  medications: string;
  lifestyle_advice: string;
  follow_up_instructions: string;
}

interface FeeItem {
  description: string;
  amount: number;
}

interface PatientResult {
  patient_id: number;
  full_name: string;
  contact_info: string;
  case_count: number;
}

type PaymentMethod = "cash" | "momo" | "nhis" | "card_pos";

// ─── Payment methods ──────────────────────────────────────────────────────────
const PAYMENT_METHODS: {
  key: PaymentMethod;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: "cash",
    label: "Cash",
    icon: "💵",
    description: "Patient pays at counter",
  },
  {
    key: "momo",
    label: "Mobile Money",
    icon: "📱",
    description: "MTN MoMo / Vodafone Cash / AirtelTigo",
  },
  {
    key: "nhis",
    label: "NHIS",
    icon: "🏥",
    description: "National Health Insurance Scheme",
  },
  {
    key: "card_pos",
    label: "Card / POS",
    icon: "💳",
    description: "Debit or credit via POS machine",
  },
];

// ─── Default fee structure ────────────────────────────────────────────────────
const DEFAULT_FEES: FeeItem[] = [
  { description: "Consultation Fee", amount: 50 },
  { description: "Teledermatology Review Fee", amount: 120 },
  { description: "Treatment Plan Fee", amount: 30 },
];

// ─── Root component — decides which view to show ──────────────────────────────
export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("case_id");
  const patientId = searchParams.get("patient_id");

  // No IDs → show patient selector first
  if (!caseId || !patientId) {
    return <BillingPatientSelector />;
  }

  // IDs present → show invoice form
  return (
    <BillingInvoiceForm caseId={Number(caseId)} patientId={Number(patientId)} />
  );
}

// ─── Patient selector ─────────────────────────────────────────────────────────
function BillingPatientSelector() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedP, setSelectedP] = useState<PatientResult | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // ── Debounced patient search ────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/clinicians/patients/search?q=${encodeURIComponent(
            query.trim()
          )}`,
          { headers: auth() }
        );
        const data = await res.json();
        setResults(data.patients || []);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // ── Fetch treatment_ready cases when patient is selected ───────────────
  const selectPatient = async (p: PatientResult) => {
    setSelectedP(p);
    setCasesLoading(true);
    try {
      const res = await fetch(
        `${API}/clinicians/patients/${p.patient_id}/cases`,
        { headers: auth() }
      );
      const data = await res.json();
      // Only show cases that are ready to be billed
      setCases(
        (data.cases || []).filter((c: any) => c.status === "treatment_ready")
      );
    } catch {
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  };

  const AVATAR_COLORS = [
    { bg: "#e0f2fe", color: "#0369a1" },
    { bg: "#d1fae5", color: "#065f46" },
    { bg: "#ede9fe", color: "#5b21b6" },
    { bg: "#fce7f3", color: "#9d174d" },
    { bg: "#fef3c7", color: "#92400e" },
  ];
  const ac = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

  // ── If patient selected — show their treatment_ready cases ─────────────
  if (selectedP) {
    return (
      <div style={s.page}>
        <div style={s.headerRow}>
          <div style={s.headerLeft}>
            <button
              style={s.backBtn}
              onClick={() => {
                setSelectedP(null);
                setCases([]);
              }}
            >
              <ArrowLeft size={15} />
              Back to Search
            </button>
            <h1 style={s.pageTitle}>Select Case to Bill</h1>
            <p style={s.pageSubtitle}>
              {selectedP.full_name} · PID-
              {String(selectedP.patient_id).padStart(6, "0")}
            </p>
          </div>
          <div style={s.headerBadge}>
            <Receipt size={15} />
            New Invoice
          </div>
        </div>

        <div style={s.selectorCard}>
          {casesLoading && (
            <div style={s.selectorHint}>
              <Activity
                size={20}
                style={{ color: "#3db5e6", marginBottom: "0.5rem" }}
              />
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                Loading cases...
              </p>
            </div>
          )}

          {!casesLoading && cases.length === 0 && (
            <div style={s.selectorHint}>
              <FileText
                size={24}
                style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
              />
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.875rem",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                No treatment-ready cases found for this patient.
              </p>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.775rem",
                  margin: "0.4rem 0 0 0",
                }}
              >
                A case must be reviewed by a dermatologist before billing.
              </p>
            </div>
          )}

          {!casesLoading && cases.length > 0 && (
            <div style={{ width: "100%" }}>
              <p style={s.selectorSub}>
                Select a treatment-ready case below to generate an invoice.
              </p>
              <div style={s.selectorResults}>
                {cases.map((c: any) => (
                  <div
                    key={c.case_id}
                    style={s.selectorRow}
                    onClick={() =>
                      navigate(
                        `/clinician/billing/new?case_id=${c.case_id}&patient_id=${selectedP.patient_id}`
                      )
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f9ff";
                      e.currentTarget.style.borderColor = "#bae6fd";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div
                      style={{
                        ...s.selectorAvatar,
                        backgroundColor: "#d1fae5",
                        color: "#065f46",
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.selectorName}>
                        Case #{c.case_id} ·{" "}
                        {c.chief_complaint || "No complaint recorded"}
                      </div>
                      <div style={s.selectorMeta}>
                        {c.lesion_location || "—"} ·{" "}
                        {new Date(c.created_at).toLocaleDateString("en-GH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor: "#d1fae5",
                        color: "#065f46",
                        padding: "0.2rem 0.65rem",
                        borderRadius: "20px",
                        flexShrink: 0,
                      }}
                    >
                      Treatment Ready
                    </div>
                    <ChevronRight
                      size={15}
                      style={{ color: "#d1d5db", flexShrink: 0 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Default — patient search screen ───────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button
            style={s.backBtn}
            onClick={() => navigate("/clinician/cases")}
          >
            <ArrowLeft size={15} />
            Back to Cases
          </button>
          <h1 style={s.pageTitle}>Billing</h1>
          <p style={s.pageSubtitle}>
            Search for a patient to generate an invoice
          </p>
        </div>
        <button
          style={s.primaryBtn}
          onClick={() => navigate("/clinician/cases")}
        >
          <FileText size={14} />
          View All Cases
        </button>
      </div>

      <div style={s.selectorCard}>
        <div style={s.selectorIcon}>
          <Users size={28} style={{ color: "#3db5e6" }} />
        </div>
        <h2 style={s.selectorTitle}>Select a Patient</h2>
        <p style={s.selectorSub}>
          Search by name, phone number, or patient ID. Only patients with
          treatment-ready cases can be billed.
        </p>

        <div
          style={{
            position: "relative",
            maxWidth: 520,
            width: "100%",
            margin: "0 auto 1.5rem",
          }}
        >
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
            }}
          />
          <input
            style={s.selectorSearch}
            placeholder="Search by name, phone, or patient ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {!query.trim() && (
          <div style={s.selectorHint}>
            <Search
              size={20}
              style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
            />
            <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
              Start typing to search patients
            </p>
          </div>
        )}

        {loading && (
          <div style={s.selectorHint}>
            <Activity
              size={20}
              style={{ color: "#3db5e6", marginBottom: "0.5rem" }}
            />
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
              Searching...
            </p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={s.selectorHint}>
            <User
              size={20}
              style={{ color: "#d1d5db", marginBottom: "0.5rem" }}
            />
            <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
              No patients found for "{query}"
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={s.selectorResults}>
            {results.map((p) => {
              const color = ac(p.patient_id);
              return (
                <div
                  key={p.patient_id}
                  style={s.selectorRow}
                  onClick={() => selectPatient(p)} // ← select, don't navigate away
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f9ff";
                    e.currentTarget.style.borderColor = "#bae6fd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div
                    style={{
                      ...s.selectorAvatar,
                      backgroundColor: color.bg,
                      color: color.color,
                    }}
                  >
                    {(p.full_name?.[0] || "P").toUpperCase()}
                    {(p.full_name?.split(" ")?.[1]?.[0] || "").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.selectorName}>{p.full_name}</div>
                    <div style={s.selectorMeta}>
                      PID-{String(p.patient_id).padStart(6, "0")}
                      {p.contact_info ? ` · ${p.contact_info}` : ""}
                    </div>
                  </div>
                  <div style={s.selectorCases}>
                    <FileText size={12} style={{ color: "#94a3b8" }} />
                    {p.case_count} case{p.case_count !== 1 ? "s" : ""}
                  </div>
                  <ChevronRight
                    size={15}
                    style={{ color: "#d1d5db", flexShrink: 0 }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <p style={s.selectorFooter}>
          After selecting a patient, choose a <strong>treatment-ready</strong>{" "}
          case to generate the invoice.
        </p>
      </div>
    </div>
  );
}

// ─── Invoice form ─────────────────────────────────────────────────────────────
function BillingInvoiceForm({
  caseId,
  patientId,
}: {
  caseId: number;
  patientId: number;
}) {
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisSummary | null>(null);
  const [treatment, setTreatment] = useState<TreatmentSummary | null>(null);
  const [fees, setFees] = useState<FeeItem[]>(DEFAULT_FEES);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [momoRef, setMomoRef] = useState("");
  const [nhisNum, setNhisNum] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

  // ── Fetch case data ───────────────────────────────────────────────────────
  const fetchCase = useCallback(async () => {
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
    } catch {
      setError("Failed to load case information.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // ── Fee helpers ───────────────────────────────────────────────────────────
  const updateDesc = (i: number, v: string) =>
    setFees((p) =>
      p.map((f, idx) => (idx === i ? { ...f, description: v } : f))
    );
  const updateAmount = (i: number, v: string) =>
    setFees((p) =>
      p.map((f, idx) => (idx === i ? { ...f, amount: parseFloat(v) || 0 } : f))
    );
  const removeFee = (i: number) =>
    setFees((p) => p.filter((_, idx) => idx !== i));
  const addFee = () => setFees((p) => [...p, { description: "", amount: 0 }]);

  const total = fees.reduce((sum, f) => sum + f.amount, 0);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (fees.some((f) => !f.description.trim())) {
      setError("All fee items must have a description.");
      return;
    }
    if (total <= 0) {
      setError("Total must be greater than 0.");
      return;
    }
    if (payMethod === "momo" && !momoRef.trim()) {
      setError("Please enter the MoMo transaction reference number.");
      return;
    }
    if (payMethod === "nhis" && !nhisNum.trim()) {
      setError("Please enter the patient's NHIS card number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/clinicians/billing`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          patient_id: patientId,
          fees,
          total_amount: total,
          payment_method: payMethod,
          payment_reference:
            payMethod === "momo"
              ? momoRef.trim()
              : payMethod === "nhis"
              ? nhisNum.trim()
              : null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Payment failed");
      }
      const data = await res.json();
      setInvoiceId(data.invoice_id || null);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Activity size={36} style={{ color: "#3db5e6" }} />
        <div style={{ color: "#64748b", marginTop: "1rem" }}>
          Loading billing information...
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={s.page}>
        <div style={s.successCard}>
          <CheckCircle
            size={52}
            style={{ color: "#059669", marginBottom: "1rem" }}
          />
          <h2 style={s.successTitle}>Payment Recorded</h2>
          <p style={s.successSub}>
            Case #{caseId} is now marked as <strong>Completed</strong>. The
            invoice has been saved to the patient's record.
          </p>
          {invoiceId && (
            <div style={s.invoiceRef}>
              Invoice Ref: INV-{String(invoiceId).padStart(5, "0")}
            </div>
          )}
          <div style={s.payMethodSummary}>
            {PAYMENT_METHODS.find((m) => m.key === payMethod)?.icon}{" "}
            {PAYMENT_METHODS.find((m) => m.key === payMethod)?.label} ·{" "}
            <strong>GHS {total.toFixed(2)}</strong>
          </div>
          <div style={s.successActions}>
            <button style={s.outlineBtn} onClick={() => window.print()}>
              <Printer size={14} />
              Print Receipt
            </button>
            <button
              style={s.primaryBtn}
              onClick={() => navigate(`/clinician/patients/${patientId}`)}
            >
              View Patient
            </button>
            <button
              style={s.primaryBtn}
              onClick={() => navigate("/clinician/cases")}
            >
              All Cases
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button
            style={s.backBtn}
            onClick={() => navigate(`/clinician/cases/${caseId}`)}
          >
            <ArrowLeft size={15} />
            Back to Case
          </button>
          <h1 style={s.pageTitle}>Record Payment</h1>
          <p style={s.pageSubtitle}>
            Case #{caseId} · {caseData?.patient_name}
          </p>
        </div>
        <div style={s.headerBadge}>
          <Receipt size={15} />
          Finalise & Close Case
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={s.errorBanner}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={s.dismissBtn} onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}

      <div style={s.twoCol}>
        {/* ── Left — context ── */}
        <div style={s.leftCol}>
          <div style={s.card}>
            <SectionHead
              icon={<User size={15} style={{ color: "#3db5e6" }} />}
              title="Patient & Case"
            />
            <InfoRow label="Patient" value={caseData?.patient_name || "—"} />
            <InfoRow label="Contact" value={caseData?.patient_contact || "—"} />
            <InfoRow label="Case" value={`#${caseId}`} />
            <InfoRow
              label="Complaint"
              value={caseData?.chief_complaint || "—"}
            />
          </div>

          {diagnosis && (
            <div style={s.card}>
              <SectionHead
                icon={<Stethoscope size={15} style={{ color: "#059669" }} />}
                title="Dermatologist Diagnosis"
              />
              <div style={s.diagnosisPill}>
                {diagnosis.final_diagnosis.charAt(0).toUpperCase() +
                  diagnosis.final_diagnosis.slice(1)}
              </div>
              <div style={{ marginTop: "0.875rem" }}>
                <InfoRow
                  label="Reviewed by"
                  value={diagnosis.dermatologist_name}
                />
                <InfoRow
                  label="Date"
                  value={formatDateShort(diagnosis.approved_at)}
                />
              </div>
            </div>
          )}

          {treatment?.medications && (
            <div style={s.card}>
              <SectionHead
                icon={<Pill size={15} style={{ color: "#8b5cf6" }} />}
                title="Prescribed Treatment"
              />
              <div style={s.treatBlock}>
                <span style={s.treatLabel}>Medications</span>
                <span style={s.treatValue}>{treatment.medications}</span>
              </div>
              {treatment.follow_up_instructions && (
                <div style={s.treatBlock}>
                  <span style={s.treatLabel}>Follow-up</span>
                  <span style={s.treatValue}>
                    {treatment.follow_up_instructions}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right — invoice builder ── */}
        <div style={s.rightCol}>
          {/* Fee line items */}
          <div style={s.card}>
            <SectionHead
              icon={<FileText size={15} style={{ color: "#3db5e6" }} />}
              title="Fee Breakdown"
            />
            <div style={s.feeHeadings}>
              <span style={{ flex: 1 }}>Description</span>
              <span style={{ width: 120, textAlign: "right" as const }}>
                Amount (GHS)
              </span>
              <span style={{ width: 30 }} />
            </div>
            {fees.map((fee, i) => (
              <div key={i} style={s.feeRow}>
                <input
                  style={{ ...s.feeInput, flex: 1 }}
                  value={fee.description}
                  placeholder="e.g. Consultation Fee"
                  onChange={(e) => updateDesc(i, e.target.value)}
                />
                <input
                  style={{
                    ...s.feeInput,
                    width: 110,
                    textAlign: "right" as const,
                  }}
                  type="number"
                  min={0}
                  step={0.01}
                  value={fee.amount}
                  onChange={(e) => updateAmount(i, e.target.value)}
                />
                {fees.length > 1 && (
                  <button style={s.removeBtn} onClick={() => removeFee(i)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button style={s.addLineBtn} onClick={addFee}>
              + Add line item
            </button>
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Total</span>
              <span style={s.totalValue}>GHS {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={s.card}>
            <SectionHead
              icon={<CreditCard size={15} style={{ color: "#3db5e6" }} />}
              title="Payment Method"
            />
            <p style={s.methodNote}>
              Select how the patient has paid. You are recording a payment that
              has already been collected at the clinic.
            </p>
            <div style={s.methodGrid}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  style={{
                    ...s.methodBtn,
                    ...(payMethod === m.key ? s.methodBtnActive : {}),
                  }}
                  onClick={() => setPayMethod(m.key)}
                >
                  <span style={{ fontSize: "1.4rem" }}>{m.icon}</span>
                  <span style={s.methodLabel}>{m.label}</span>
                  <span style={s.methodDesc}>{m.description}</span>
                </button>
              ))}
            </div>

            {payMethod === "momo" && (
              <div style={s.refField}>
                <label style={s.refLabel}>
                  MoMo Transaction Reference <span style={s.required}>*</span>
                </label>
                <input
                  style={s.refInput}
                  placeholder="e.g. 0XXXXXXXX or confirmation code"
                  value={momoRef}
                  onChange={(e) => setMomoRef(e.target.value)}
                />
                <p style={s.refHint}>
                  Ask the patient for the SMS confirmation code or transaction
                  ID from their MoMo wallet after payment to your merchant
                  number.
                </p>
              </div>
            )}

            {payMethod === "nhis" && (
              <div style={s.refField}>
                <label style={s.refLabel}>
                  NHIS Card Number <span style={s.required}>*</span>
                </label>
                <input
                  style={s.refInput}
                  placeholder="e.g. NHF-XXXXXXXXX"
                  value={nhisNum}
                  onChange={(e) => setNhisNum(e.target.value)}
                />
                <p style={s.refHint}>
                  Record the patient's NHIS card number for insurance claim
                  reconciliation.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={s.card}>
            <SectionHead
              icon={<FileText size={15} style={{ color: "#94a3b8" }} />}
              title="Billing Notes (optional)"
            />
            <textarea
              style={s.notesArea}
              rows={3}
              placeholder="e.g. partial payment, discount applied, insurance pre-auth code..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {payMethod === "nhis" && (
            <div style={s.nhisNotice}>
              <ShieldCheck
                size={15}
                style={{ flexShrink: 0, color: "#059669" }}
              />
              <span>
                NHIS claims are submitted separately through the NHIS claims
                portal. This entry records the consultation for your internal
                records only.
              </span>
            </div>
          )}

          {/* Confirm */}
          <button
            style={{
              ...s.confirmBtn,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            <CheckCircle size={18} />
            {submitting
              ? "Recording..."
              : `Confirm Payment — GHS ${total.toFixed(2)}`}
          </button>
          <p style={s.confirmNote}>
            This will mark Case #{caseId} as <strong>Completed</strong> and save
            the invoice permanently.
          </p>
        </div>
      </div>
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
  pageSubtitle: { fontSize: "0.875rem", color: "#64748b", margin: 0 },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#f0fdf4",
    border: "1px solid #6ee7b7",
    color: "#065f46",
    padding: "0.5rem 1rem",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: 600,
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
    marginBottom: "1.25rem",
    fontSize: "0.875rem",
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 700,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  rightCol: { display: "flex", flexDirection: "column", gap: "1.25rem" },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.1rem",
  },
  sectionTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f8fafc",
  },
  infoLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  infoValue: {
    fontSize: "0.875rem",
    color: "#111827",
    fontWeight: 500,
    textAlign: "right",
  },

  diagnosisPill: {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontWeight: 700,
    fontSize: "0.9rem",
    padding: "0.35rem 1rem",
    borderRadius: "20px",
  },
  treatBlock: { marginBottom: "0.75rem" },
  treatLabel: {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "0.2rem",
  },
  treatValue: { fontSize: "0.875rem", color: "#374151", lineHeight: 1.5 },

  feeHeadings: {
    display: "flex",
    gap: "0.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "0.75rem",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  feeRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  feeInput: {
    padding: "0.55rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#111827",
    backgroundColor: "#f8fafc",
    outline: "none",
    boxSizing: "border-box",
  },
  removeBtn: {
    width: 26,
    height: 26,
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.7rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addLineBtn: {
    background: "none",
    border: "1px dashed #d1d5db",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "0.8rem",
    padding: "0.5rem",
    cursor: "pointer",
    width: "100%",
    marginTop: "0.25rem",
    marginBottom: "1.25rem",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 0 0 0",
    borderTop: "2px solid #e5e7eb",
  },
  totalLabel: { fontSize: "0.9rem", fontWeight: 700, color: "#374151" },
  totalValue: { fontSize: "1.4rem", fontWeight: 800, color: "#059669" },

  methodNote: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    marginBottom: "1rem",
    lineHeight: 1.5,
  },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  methodBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.875rem 0.5rem",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f8fafc",
    cursor: "pointer",
  },
  methodBtnActive: { borderColor: "#3db5e6", backgroundColor: "#e0f2fe" },
  methodLabel: { fontSize: "0.8rem", fontWeight: 700, color: "#111827" },
  methodDesc: { fontSize: "0.68rem", color: "#94a3b8", textAlign: "center" },

  refField: {
    marginTop: "0.75rem",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "1rem",
    border: "1px solid #e5e7eb",
  },
  refLabel: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.5rem",
  },
  required: { color: "#ef4444", marginLeft: "0.2rem" },
  refInput: {
    width: "100%",
    padding: "0.65rem 0.875rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#111827",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  },
  refHint: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    margin: "0.4rem 0 0 0",
    lineHeight: 1.5,
  },

  notesArea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "0.875rem",
    color: "#374151",
    resize: "vertical",
    fontFamily: "inherit",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  },
  nhisNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    backgroundColor: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: "10px",
    padding: "0.875rem 1rem",
    fontSize: "0.8rem",
    color: "#065f46",
    lineHeight: 1.5,
  },

  confirmBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    width: "100%",
    padding: "1rem",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    fontWeight: 700,
    fontSize: "1rem",
  },
  confirmNote: {
    fontSize: "0.775rem",
    color: "#94a3b8",
    textAlign: "center",
    margin: "0.5rem 0 0 0",
    lineHeight: 1.5,
  },

  successCard: {
    maxWidth: 500,
    margin: "5rem auto",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    padding: "3rem 2.5rem",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  successTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 0.75rem 0",
  },
  successSub: {
    fontSize: "0.9rem",
    color: "#64748b",
    lineHeight: 1.6,
    margin: "0 0 1.25rem 0",
  },
  invoiceRef: {
    backgroundColor: "#f0fdf4",
    color: "#059669",
    fontWeight: 700,
    fontSize: "0.9rem",
    padding: "0.4rem 1.25rem",
    borderRadius: "20px",
    marginBottom: "0.75rem",
  },
  payMethodSummary: {
    fontSize: "0.875rem",
    color: "#374151",
    marginBottom: "1.75rem",
  },
  successActions: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  outlineBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    background: "white",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    backgroundColor: "#3db5e6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },

  // ── Selector styles ──
  selectorCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    padding: "3rem 2.5rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    maxWidth: 620,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  selectorIcon: {
    width: 64,
    height: 64,
    borderRadius: "16px",
    backgroundColor: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.25rem",
  },
  selectorTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 0.5rem 0",
  },
  selectorSub: {
    fontSize: "0.875rem",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
    margin: "0 0 1.75rem 0",
    maxWidth: 440,
  },
  selectorSearch: {
    width: "100%",
    padding: "0.75rem 0.875rem 0.75rem 2.5rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "0.9rem",
    color: "#374151",
    outline: "none",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  },
  selectorHint: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 0",
    width: "100%",
  },
  selectorResults: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    maxHeight: 360,
    overflowY: "auto",
    marginBottom: "1.25rem",
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    padding: "0.875rem 1rem",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  selectorAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  selectorName: { fontWeight: 600, fontSize: "0.9rem", color: "#111827" },
  selectorMeta: { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem" },
  selectorCases: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: 500,
    flexShrink: 0,
  },
  selectorFooter: {
    fontSize: "0.775rem",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.6,
    margin: "0.5rem 0 0 0",
  },
};
