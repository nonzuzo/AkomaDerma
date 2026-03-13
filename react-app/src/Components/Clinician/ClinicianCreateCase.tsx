// src/Components/Clinician/ClinicianCreateCase.tsx
// 5-step wizard for creating a new dermatology case and uploading lesion images.
// Flow: Select Patient → Record Vitals → Chief Complaint → Upload Images → Review & Submit
//
// Submit flow (two-step):
//   Step A → POST /clinicians/cases/submit       creates the case, returns case_id
//   Step B → POST /clinicians/cases/:id/images   uploads image files to case_images table

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Search,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
// Single API base — avoids repeating import.meta.env.VITE_API_URL everywhere
const API = `${import.meta.env.VITE_API_URL}`;
const token = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${token()}` });

// Gradient style for the page title
const gradientTitleStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  fontWeight: "bold",
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  margin: 0,
  lineHeight: 1.2,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vitals {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
  height: string;
}

interface FormData {
  patientPid: string;
  vitals: Vitals;
  chiefComplaint: string;
  lesionDuration: string;
  lesionLocation: string;
  symptoms: string;
  priorTreatment: string;
  lesionType: string;
  parentCaseId: number | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClinicianCreateCase() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    patientPid: "",
    vitals: { bp: "", pulse: "", temp: "", weight: "", height: "" },
    chiefComplaint: "",
    lesionDuration: "",
    lesionLocation: "",
    symptoms: "",
    priorTreatment: "",
    lesionType: "",
    parentCaseId: null,
  });

  // Set when navigating here from the appointments page
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  // Image files selected in Step 4 — uploaded in handleSubmitCase Step B
  const [images, setImages] = useState<File[]>([]);

  // Step 1 patient search state
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const navigate = useNavigate();

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // ── On mount — read URL params ───────────────────────────────────────────
  // patient_id and appointment_id may be pre-filled when navigating from
  // the Patient Profile or Appointments pages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get("patient_id");
    const parentCaseIdRaw = urlParams.get("parent_case_id");
    const appointmentIdRaw = urlParams.get("appointment_id");

    if (appointmentIdRaw) setAppointmentId(Number(appointmentIdRaw));

    if (patientId) {
      // Pre-select patient and skip to Step 2
      setFormData((prev) => ({
        ...prev,
        patientPid: patientId,
        parentCaseId: parentCaseIdRaw ? Number(parentCaseIdRaw) : null,
      }));
      setStep(2);
    } else {
      fetchRecentPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch recent patients ────────────────────────────────────────────────
  const fetchRecentPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch(`${API}/clinicians/patients/search`, {
        headers: auth(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to load recent patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  // ── Patient search ───────────────────────────────────────────────────────
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      fetchRecentPatients();
      return;
    }
    try {
      const res = await fetch(
        `${API}/clinicians/patients/search?q=${encodeURIComponent(query)}`,
        { headers: auth() }
      );
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error("Patient search failed:", error);
    }
  };

  // ── Update a single vitals field ─────────────────────────────────────────
  const updateVitals = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: value },
    }));
  };

  // ── Case submission ──────────────────────────────────────────────────────
  // Step A: POST /clinicians/cases/submit        → creates case, returns case_id
  // Step B: POST /clinicians/cases/:id/images    → uploads images to case_images
  //
  // Images are sent in a separate multipart request AFTER the case is created
  // because the case_id is required to link images in the case_images table.
  const handleSubmitCase = async () => {
    console.log("🚀 handleSubmitCase called");
    console.log("Patient PID:", formData.patientPid);
    console.log("Images count:", images.length);
    console.log("Chief complaint:", formData.chiefComplaint);

    // Client-side validation
    if (!formData.patientPid) {
      setSubmitError("Please select a patient");
      return;
    }
    if (!formData.chiefComplaint.trim()) {
      setSubmitError("Chief complaint is required");
      return;
    }
    if (images.length === 0) {
      setSubmitError("At least one image is required");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      // ── Step A: Create the case ─────────────────────────────────────────
      console.log("📤 Submitting case to backend...");
      const caseRes = await fetch(`${API}/clinicians/cases/submit`, {
        method: "POST",
        headers: {
          ...auth(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: parseInt(formData.patientPid),
          vitals: JSON.stringify(formData.vitals),
          chief_complaint: formData.chiefComplaint,
          lesion_duration: formData.lesionDuration,
          lesion_location: formData.lesionLocation,
          symptoms: formData.symptoms,
          prior_treatment: formData.priorTreatment,
          lesion_type: formData.lesionType,
          image_count: images.length,
          parent_case_id: formData.parentCaseId,
        }),
      });

      if (!caseRes.ok) {
        const errorData = await caseRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit case");
      }

      const caseData = await caseRes.json();
      const caseId = caseData.case_id;
      console.log("✅ Case created with ID:", caseId);

      // ── Step B: Upload images ───────────────────────────────────────────
      // Do NOT set Content-Type manually — browser sets it automatically
      // with the correct multipart boundary when body is FormData
      console.log("⬆️ Uploading images for case:", caseId);
      const imageFormData = new FormData();
      images.forEach((img) => imageFormData.append("images", img));

      const imgRes = await fetch(`${API}/clinicians/cases/${caseId}/images`, {
        method: "POST",
        headers: auth(), // ← auth only, NO Content-Type header
        body: imageFormData,
      });

      if (!imgRes.ok) {
        const err = await imgRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to upload images");
      }

      console.log("✅ Images uploaded successfully");
      alert("Case submitted successfully to dermatologist!");
      navigate("/clinician/dashboard");
    } catch (error) {
      console.error("Case submission error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit case"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={pageContainer}>
      {/* Page header */}
      <div style={header}>
        <h1 style={gradientTitleStyle}>Create New Case</h1>
        <p style={subtitle}>Complete dermatology case for specialist review</p>
      </div>

      {/* Step progress indicator */}
      <div style={stepper}>
        {["Patient", "Vitals", "Complaint", "Images", "Review"].map(
          (label, index) => (
            <div key={index} style={stepItem(step === index + 1)}>
              <div style={stepCircle(step === index + 1)}>{index + 1}</div>
              <div style={stepLabel}>{label}</div>
            </div>
          )
        )}
      </div>

      {/* Step content */}
      <div style={content}>
        {step === 1 && (
          <Step1
            patients={patients}
            formData={formData}
            setFormData={setFormData}
            loadingPatients={loadingPatients}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            selectedPatientId={formData.patientPid}
          />
        )}
        {step === 2 && (
          <Step2 formData={formData} updateVitals={updateVitals} />
        )}
        {step === 3 && <Step3 formData={formData} setFormData={setFormData} />}
        {step === 4 && <Step4 images={images} setImages={setImages} />}
        {step === 5 && (
          <Step5
            formData={formData}
            images={images}
            submitError={submitError}
            submitting={submitting}
            onSubmit={handleSubmitCase}
            appointmentId={appointmentId}
          />
        )}
      </div>

      {/* ── Navigation bar ──────────────────────────────────────────────────
          Handles Previous and Next for steps 1–4 only.
          Step 5 has its own dedicated Submit button inside the Step5 component.
          This eliminates all step-counting logic from the submit action. */}
      <div style={navigation}>
        {step > 1 && (
          <button
            style={navButton("secondary")}
            onClick={prevStep}
            disabled={submitting}
          >
            <ArrowLeft size={16} /> Previous
          </button>
        )}
        <div style={stepCounter}>Step {step} of 5</div>
        {/* Only show Next button on steps 1–4 */}
        {step < 5 && (
          <button
            style={navButton("primary")}
            onClick={nextStep}
            disabled={submitting}
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Patient Selection ────────────────────────────────────────────────
function Step1({
  patients,
  formData,
  setFormData,
  loadingPatients,
  searchQuery,
  onSearch,
  selectedPatientId,
}: any) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Select Patient</h2>
      <div style={searchContainer}>
        <Search size={18} style={searchIcon} />
        <input
          style={searchInput}
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {loadingPatients ? (
        <div style={loadingText}>Loading recent patients...</div>
      ) : (
        <div style={patientList}>
          {patients.length === 0 ? (
            <div style={loadingText}>
              No patients found. Try searching by name or phone.
            </div>
          ) : (
            patients.map((patient: any) => (
              <div
                key={patient.patient_id}
                style={{
                  ...patientCard,
                  ...(selectedPatientId === patient.patient_id.toString()
                    ? selectedPatientStyle
                    : {}),
                }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    patientPid: patient.patient_id.toString(),
                  })
                }
              >
                <div style={patientAvatar}>
                  {(patient.full_name?.[0] || "P").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={patientName}>
                    {patient.full_name || "Unknown"}
                  </div>
                  <div style={patientPid}>
                    PID-{String(patient.patient_id).padStart(6, "0")}
                  </div>
                </div>
                {patient.case_count > 0 && (
                  <div style={caseBadge}>
                    {patient.case_count}{" "}
                    {patient.case_count === 1 ? "case" : "cases"}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Vitals ───────────────────────────────────────────────────────────
function Step2({
  formData,
  updateVitals,
}: {
  formData: FormData;
  updateVitals: (field: string, value: string) => void;
}) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Record Vitals</h2>
      <div style={vitalsGrid}>
        <FormInput
          label="Blood Pressure"
          value={formData.vitals.bp}
          onChange={(v) => updateVitals("bp", v)}
          placeholder="120/80"
        />
        <FormInput
          label="Pulse"
          value={formData.vitals.pulse}
          onChange={(v) => updateVitals("pulse", v)}
          placeholder="72 bpm"
        />
        <FormInput
          label="Temperature"
          value={formData.vitals.temp}
          onChange={(v) => updateVitals("temp", v)}
          placeholder="36.8°C"
        />
        <FormInput
          label="Weight"
          value={formData.vitals.weight}
          onChange={(v) => updateVitals("weight", v)}
          placeholder="70 kg"
        />
        <FormInput
          label="Height"
          value={formData.vitals.height}
          onChange={(v) => updateVitals("height", v)}
          placeholder="170 cm"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Chief Complaint ──────────────────────────────────────────────────
function Step3({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Chief Complaint</h2>
      <div style={formGrid}>
        <div style={twoCol}>
          <FormInput
            label="Lesion Duration"
            value={formData.lesionDuration}
            onChange={(v) => setFormData((p) => ({ ...p, lesionDuration: v }))}
            placeholder="3 weeks"
          />
          <FormInput
            label="Lesion Location"
            value={formData.lesionLocation}
            onChange={(v) => setFormData((p) => ({ ...p, lesionLocation: v }))}
            placeholder="Chest, back"
          />
        </div>
        <FormTextarea
          label="Chief Complaint *"
          value={formData.chiefComplaint}
          onChange={(v) => setFormData((p) => ({ ...p, chiefComplaint: v }))}
          placeholder="Describe the main skin concern in detail..."
        />
        <FormTextarea
          label="Symptoms"
          value={formData.symptoms}
          onChange={(v) => setFormData((p) => ({ ...p, symptoms: v }))}
          placeholder="Itching, pain, spreading pattern..."
        />
        <FormInput
          label="Prior Treatment"
          value={formData.priorTreatment}
          onChange={(v) => setFormData((p) => ({ ...p, priorTreatment: v }))}
          placeholder="Hydrocortisone cream, antifungals..."
        />
        <FormInput
          label="Lesion Type"
          value={formData.lesionType}
          onChange={(v) => setFormData((p) => ({ ...p, lesionType: v }))}
          placeholder="Rash, pustules, scaling, vesicles"
        />
      </div>
    </div>
  );
}

// ─── Step 4: Image Upload ─────────────────────────────────────────────────────
// Files are stored in state here and uploaded in handleSubmitCase Step B.
function Step4({
  images,
  setImages,
}: {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImages((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>
        Clinical Images <span style={required}>Required</span>
      </h2>
      <div
        style={dropZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload size={48} style={dropIcon} />
        <h3 style={dropTitle}>Drag & drop images here</h3>
        <p style={dropText}>JPG, PNG (max 10MB total, up to 5 images)</p>
        <input
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          id="imageUpload"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          style={browseButton}
          onClick={() =>
            (
              document.getElementById("imageUpload") as HTMLInputElement
            )?.click()
          }
        >
          Browse Files
        </button>
      </div>
      {images.length > 0 && (
        <div style={imagePreview}>
          <h4 style={{ margin: "0 0 1rem 0" }}>
            {images.length} image(s) selected
          </h4>
          <div style={previewGrid}>
            {images.slice(0, 5).map((img, idx) => (
              <div key={idx} style={previewItem}>
                <img
                  src={URL.createObjectURL(img)}
                  style={previewImage}
                  alt={`Preview ${idx + 1}`}
                />
                <button
                  type="button"
                  style={removeBtn}
                  onClick={() => removeImage(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Review & Submit ──────────────────────────────────────────────────
// Read-only summary of all entered data.
// ✅ Has its own Submit button — does NOT rely on the navigation bar.
// This is the fix for the button never calling handleSubmitCase.
function Step5({
  formData,
  images,
  submitError,
  submitting,
  onSubmit,
  appointmentId,
}: {
  formData: FormData;
  images: File[];
  submitError: string;
  submitting: boolean;
  onSubmit: () => void;
  appointmentId: number | null;
}) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Review & Submit</h2>

      <div style={reviewGrid}>
        <div style={reviewSection}>
          <h3>Patient ID</h3>
          <p style={reviewValue}>{formData.patientPid || "Not selected"}</p>
        </div>
        <div style={reviewSection}>
          <h3>Vitals</h3>
          <p style={reviewValue}>
            BP: {formData.vitals.bp || "N/A"} | Weight:{" "}
            {formData.vitals.weight || "N/A"} kg
          </p>
        </div>
        <div style={reviewSection}>
          <h3>Images</h3>
          <p style={reviewValue}>{images.length} photo(s) ready to upload</p>
        </div>
        <div style={reviewSection}>
          <h3>Chief Complaint</h3>
          <p style={reviewValue}>
            {formData.chiefComplaint
              ? `${formData.chiefComplaint.slice(0, 100)}${
                  formData.chiefComplaint.length > 100 ? "..." : ""
                }`
              : "N/A"}
          </p>
        </div>
        {formData.parentCaseId && (
          <div style={reviewSection}>
            <h3>Follow-up</h3>
            <p style={reviewValue}>
              Follow-up to Case #{formData.parentCaseId}
            </p>
          </div>
        )}
        {appointmentId && (
          <div style={reviewSection}>
            <h3>Appointment</h3>
            <p style={reviewValue}>From Appointment #{appointmentId}</p>
          </div>
        )}
      </div>

      <div style={submitNote}>
        <CheckCircle size={20} style={{ color: "#10b981" }} />
        <span>
          This case will be sent for AI analysis and assigned to the dermatology
          specialist queue.
        </span>
      </div>

      {/* Inline error shown above the submit button */}
      {submitError && <div style={errorMessage}>{submitError}</div>}

      {submitting && (
        <p style={{ textAlign: "center", color: "#6b7280", marginTop: "1rem" }}>
          Uploading case and images, please wait...
        </p>
      )}

      {/* ✅ Dedicated submit button — direct onClick, no step logic */}
      <button
        style={{
          width: "100%",
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: submitting ? "#94a3b8" : "#3db5e6",
          color: "#ffffff",
          border: "none",
          borderRadius: "10px",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
        onClick={onSubmit}
        disabled={submitting}
      >
        {submitting ? "Uploading..." : "✅ Submit Case to Dermatologist"}
      </button>
    </div>
  );
}

// ─── Reusable form components ─────────────────────────────────────────────────
function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div style={formGroup}>
      <label style={formLabel}>{label}</label>
      <input
        style={formInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div style={formGroup}>
      <label style={formLabel}>{label}</label>
      <textarea
        style={formTextarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pageContainer: React.CSSProperties = {
  padding: "2rem 0",
  maxWidth: "900px",
  margin: "0 auto",
  width: "100%",
};
const header: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "2rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};
const subtitle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "0.95rem",
  marginTop: "0.5rem",
};
const stepper: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "3rem",
  marginBottom: "2.5rem",
  flexWrap: "wrap",
};
const stepItem = (active: boolean): React.CSSProperties => ({
  opacity: active ? 1 : 0.4,
  textAlign: "center",
});
const stepCircle = (active: boolean): React.CSSProperties => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  backgroundColor: active ? "#3db5e6" : "#f3f4f6",
  color: active ? "#ffffff" : "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  marginBottom: "0.5rem",
});
const stepLabel: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#374151",
};
const content: React.CSSProperties = { marginBottom: "3rem" };
const stepCard: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "2.5rem",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};
const stepTitle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: 600,
  color: "#111827",
  marginBottom: "1.5rem",
};
const required: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "0.9rem",
  fontWeight: 500,
};
const navigation: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "600px",
  margin: "0 auto",
};
const stepCounter: React.CSSProperties = {
  fontWeight: 500,
  color: "#6b7280",
  fontSize: "0.95rem",
};
const navButton = (type: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.875rem 2rem",
  borderRadius: "8px",
  fontWeight: 500,
  cursor: "pointer",
  border: type === "secondary" ? "1px solid #d1d5db" : "none",
  backgroundColor: type === "primary" ? "#3db5e6" : "transparent",
  color: type === "primary" ? "#ffffff" : "#374151",
});
const searchContainer: React.CSSProperties = {
  position: "relative",
  marginBottom: "2rem",
};
const searchIcon: React.CSSProperties = {
  position: "absolute",
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
};
const searchInput: React.CSSProperties = {
  width: "100%",
  padding: "0.875rem 1rem 0.875rem 3rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};
const patientList: React.CSSProperties = {
  maxHeight: "400px",
  overflowY: "auto",
};
const patientCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  padding: "1.25rem",
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid #e5e7eb",
  marginBottom: "0.5rem",
};
const selectedPatientStyle: React.CSSProperties = {
  borderColor: "#3db5e6",
  backgroundColor: "#f0f9ff",
  boxShadow: "0 0 0 3px rgba(59,181,230,0.1)",
};
const patientAvatar: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "12px",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: "1.1rem",
  flexShrink: 0,
};
const patientName: React.CSSProperties = {
  fontWeight: 600,
  color: "#111827",
  marginBottom: "0.25rem",
};
const patientPid: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#6b7280",
};
const caseBadge: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "0.25rem 0.65rem",
  borderRadius: "20px",
  backgroundColor: "#ede9fe",
  color: "#5b21b6",
};
const loadingText: React.CSSProperties = {
  textAlign: "center",
  padding: "2rem",
  color: "#6b7280",
};
const vitalsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1.5rem",
};
const formGrid: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};
const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
};
const formGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};
const formLabel: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#374151",
  marginBottom: "0.5rem",
  fontWeight: 500,
};
const formInput: React.CSSProperties = {
  padding: "0.875rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "0.95rem",
};
const formTextarea: React.CSSProperties = {
  ...formInput,
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
};
const dropZone: React.CSSProperties = {
  border: "2px dashed #d1d5db",
  borderRadius: "12px",
  padding: "3rem 2rem",
  textAlign: "center",
  backgroundColor: "#fafbfc",
};
const dropIcon: React.CSSProperties = {
  color: "#9ca3af",
  margin: "0 auto 1rem",
  display: "block",
};
const dropTitle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#111827",
  marginBottom: "0.5rem",
};
const dropText: React.CSSProperties = {
  color: "#6b7280",
  marginBottom: "2rem",
};
const browseButton: React.CSSProperties = {
  padding: "0.75rem 2rem",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 500,
};
const imagePreview: React.CSSProperties = { marginTop: "2rem" };
const previewGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "1rem",
};
const previewItem: React.CSSProperties = { position: "relative" };
const previewImage: React.CSSProperties = {
  width: "100%",
  height: 100,
  objectFit: "cover",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};
const removeBtn: React.CSSProperties = {
  position: "absolute",
  top: "-8px",
  right: "-8px",
  backgroundColor: "#ef4444",
  color: "#ffffff",
  border: "none",
  borderRadius: "50%",
  width: 24,
  height: 24,
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const reviewGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1.5rem",
};
const reviewSection: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};
const reviewValue: React.CSSProperties = {
  fontWeight: 500,
  color: "#111827",
  margin: "0.25rem 0 0 0",
};
const submitNote: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  backgroundColor: "#f0fdf4",
  padding: "1.5rem",
  borderRadius: "8px",
  marginTop: "2rem",
  color: "#166534",
  border: "1px solid #bbf7d0",
};
const errorMessage: React.CSSProperties = {
  backgroundColor: "#fee2e2",
  color: "#dc2626",
  padding: "1rem",
  borderRadius: "8px",
  borderLeft: "4px solid #ef4444",
  marginTop: "1rem",
  fontSize: "0.9rem",
};
