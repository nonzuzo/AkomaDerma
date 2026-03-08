// src/Components/Clinician/ClinicianCreateCase.tsx
// Complete CreateCase component with backend integration for WALK-IN FLOW
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

// Gradient title style for main header
const gradientTitleStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold" as const,
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  margin: 0,
  lineHeight: 1.2,
};

// Main CreateCase component with 5-step wizard
export default function ClinicianCreateCase() {
  // Step navigation state
  const [step, setStep] = useState(1);

  // Form data state matching database cases table schema
  const [formData, setFormData] = useState({
    patientPid: "",
    vitals: { bp: "", pulse: "", temp: "", weight: "", height: "" },
    chiefComplaint: "",
    lesionDuration: "",
    lesionLocation: "",
    symptoms: "",
    priorTreatment: "", // Maps to prior_treatment in DB
    lesionType: "",
    parentCaseId: null as number | null,
  });

  // NEW: store appointment_id if coming from appointment page
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  // Image upload state
  const [images, setImages] = useState<File[]>([]);

  // Patient search and loading states
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Navigation hook
  const navigate = useNavigate();

  // Handle step navigation
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // Initialize component - check for walk-in patient from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get("patient_id");
    const parentCaseIdRaw = urlParams.get("parent_case_id");
    const appointmentIdRaw = urlParams.get("appointment_id");

    if (appointmentIdRaw) setAppointmentId(Number(appointmentIdRaw));

    if (patientId) {
      setFormData((prev) => ({
        ...prev,
        patientPid: patientId,
        parentCaseId: parentCaseIdRaw ? Number(parentCaseIdRaw) : null,
      }));
      setSelectedPatient({ patient_id: patientId });
      setStep(2);
    } else {
      fetchRecentPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch recent patients for Step 1 (prioritizes walk-ins and recent cases)
  const fetchRecentPatients = async () => {
    setLoadingPatients(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch(
        "http://localhost:5001/api/clinicians/patients/search",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to load recent patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Search patients by name or phone number
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      fetchRecentPatients();
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/clinicians/patients/search?q=${encodeURIComponent(
          query
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error("Patient search failed:", error);
    }
  };

  // Update vitals field in form data
  const updateVitals = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: value },
    }));
  };

  // Submit complete case to backend
  const handleSubmitCase = async () => {
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
      const token = localStorage.getItem("token");
      if (!token) {
        setSubmitError("Authentication required");
        return;
      }

      // 1) Create case (with vitals + image_count)
      const response = await fetch(
        "http://localhost:5001/api/clinicians/cases/submit",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
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
            // NOTE: not sending appointment_id yet because backend doesn’t accept it in your controller.
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit case");
      }

      const caseData = await response.json();
      const caseId = caseData.case_id;

      // 2) Upload images for this case
      const formDataImages = new FormData();
      images.forEach((img) => formDataImages.append("images", img));

      const imgRes = await fetch(
        `http://localhost:5001/api/clinicians/cases/${caseId}/images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImages,
        }
      );

      if (!imgRes.ok) {
        const err = await imgRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to upload images");
      }

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

  // Main render with 5-step wizard
  return (
    <div style={pageContainer}>
      {/* Page header with gradient title */}
      <div style={header}>
        <h1 style={gradientTitleStyle}>Create New Case</h1>
        <p style={subtitle}>Complete dermatology case for specialist review</p>
      </div>

      {/* Progress stepper showing current step */}
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

      {/* Step content - conditional rendering */}
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

      {/* Navigation controls */}
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
        <button
          style={navButton(submitting ? "disabled" : "primary")}
          onClick={step < 5 ? nextStep : handleSubmitCase}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : step === 5 ? "Submit Case" : "Next"}
          {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

// Step 1: Patient selection with search (recent patients + search)
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

      {/* Search input */}
      <div style={searchContainer}>
        <Search size={18} style={searchIcon} />
        <input
          style={searchInput}
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Loading state */}
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
                  ...(selectedPatientId === patient.patient_id.toString() &&
                    selectedPatientStyle),
                }}
                onClick={() => {
                  setFormData({
                    ...formData,
                    patientPid: patient.patient_id.toString(),
                  });
                }}
              >
                <div style={patientAvatar}>
                  {(patient.name?.[0] || "P").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={patientName}>{patient.name}</div>
                  <div style={patientPid}>ID: {patient.patient_id}</div>
                </div>
                <div style={aiSummary}>{patient.aiSummary}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Step 2: Record patient vitals
function Step2({
  formData,
  updateVitals,
}: {
  formData: any;
  updateVitals: (field: string, value: string) => void;
}) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Record Vitals</h2>
      <div style={vitalsGrid}>
        <FormInput
          label="Blood Pressure"
          value={formData.vitals.bp}
          onChange={(val) => updateVitals("bp", val)}
          placeholder="120/80"
        />
        <FormInput
          label="Pulse"
          value={formData.vitals.pulse}
          onChange={(val) => updateVitals("pulse", val)}
          placeholder="72 bpm"
        />
        <FormInput
          label="Temperature"
          value={formData.vitals.temp}
          onChange={(val) => updateVitals("temp", val)}
          placeholder="36.8°C"
        />
        <FormInput
          label="Weight"
          value={formData.vitals.weight}
          onChange={(val) => updateVitals("weight", val)}
          placeholder="70 kg"
        />
        <FormInput
          label="Height"
          value={formData.vitals.height}
          onChange={(val) => updateVitals("height", val)}
          placeholder="170 cm"
        />
      </div>
    </div>
  );
}

// Step 3: Chief complaint and symptoms
function Step3({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Chief Complaint</h2>
      <div style={formGrid}>
        <div style={twoCol}>
          <FormInput
            label="Lesion Duration"
            value={formData.lesionDuration}
            onChange={(val) =>
              setFormData({ ...formData, lesionDuration: val })
            }
            placeholder="3 weeks"
          />
          <FormInput
            label="Lesion Location"
            value={formData.lesionLocation}
            onChange={(val) =>
              setFormData({ ...formData, lesionLocation: val })
            }
            placeholder="Chest, back"
          />
        </div>

        <FormTextarea
          label="Chief Complaint *"
          value={formData.chiefComplaint}
          onChange={(val) => setFormData({ ...formData, chiefComplaint: val })}
          placeholder="Describe the main skin concern in detail..."
        />

        <FormTextarea
          label="Symptoms"
          value={formData.symptoms}
          onChange={(val) => setFormData({ ...formData, symptoms: val })}
          placeholder="Itching, pain, spreading pattern, changes over time..."
        />

        <FormInput
          label="Prior Treatment"
          value={formData.priorTreatment}
          onChange={(val) => setFormData({ ...formData, priorTreatment: val })}
          placeholder="Hydrocortisone cream, antifungals, etc."
        />

        <FormInput
          label="Lesion Type"
          value={formData.lesionType}
          onChange={(val) => setFormData({ ...formData, lesionType: val })}
          placeholder="Rash, pustules, scaling, vesicles"
        />
      </div>
    </div>
  );
}

// Step 4: Image upload with drag & drop
function Step4({ images, setImages }: { images: File[]; setImages: any }) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const newImages = Array.from(e.dataTransfer.files);
    setImages((prev: File[]) => [...prev, ...newImages]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages((prev: File[]) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== index));
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
          <h4 style={{ margin: "0 0 1rem 0" }}>{images.length} image(s)</h4>
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
                  title="Remove image"
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

// Step 5: Review and submit case
function Step5({
  formData,
  images,
  submitError,
  submitting,
  onSubmit,
  appointmentId,
}: {
  formData: any;
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
          <h3>Patient</h3>
          <p style={reviewValue}>{formData.patientPid || "Not selected"}</p>
        </div>

        <div style={reviewSection}>
          <h3>Vitals</h3>
          <p style={reviewValue}>
            BP: {formData.vitals.bp || "N/A"} | Weight:{" "}
            {formData.vitals.weight || "N/A"}kg
          </p>
        </div>

        <div style={reviewSection}>
          <h3>Images</h3>
          <p style={reviewValue}>{images.length} photos</p>
        </div>

        <div style={reviewSection}>
          <h3>Complaint</h3>
          <p style={reviewValue}>
            {formData.chiefComplaint
              ? `${formData.chiefComplaint.slice(0, 100)}...`
              : "N/A"}
          </p>
        </div>

        {formData.parentCaseId && (
          <div style={reviewSection}>
            <h3>Follow-up</h3>
            <p style={reviewValue}>
              This case is a follow-up to Case #{formData.parentCaseId}
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
          This case will be sent to AI analysis and assigned to dermatology
          specialist
        </span>
      </div>

      {submitError && <div style={errorMessage}>{submitError}</div>}

      {/* optional: show submit disabled state hint */}
      {submitting && (
        <div style={{ marginTop: "1rem", color: "#6b7280" }}>
          Submitting, please wait...
        </div>
      )}
    </div>
  );
}

// Reusable form input component
function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
        required={label.includes("*")}
      />
    </div>
  );
}

// Reusable textarea component
function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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

// All component styles
const pageContainer = {
  padding: "2rem 0",
  maxWidth: "900px",
  margin: "0 auto",
  width: "100%",
} as const;

const header = {
  backgroundColor: "#ffffff",
  padding: "2rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
} as const;

const subtitle = {
  color: "#6b7280",
  fontSize: "0.95rem",
  marginTop: "0.5rem",
} as const;

const stepper = {
  display: "flex",
  justifyContent: "center",
  gap: "3rem",
  marginBottom: "2.5rem",
  flexWrap: "wrap" as const,
} as const;

const stepItem = (active: boolean) =>
  ({
    opacity: active ? 1 : 0.4,
    textAlign: "center" as const,
  } as const);

const stepCircle = (active: boolean) =>
  ({
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: active ? "#3db5e6" : "#f3f4f6",
    color: active ? "#ffffff" : "#6b7280",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontWeight: 600,
    marginBottom: "0.5rem",
  } as const);

const stepLabel = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#374151",
} as const;

const content = { marginBottom: "3rem" } as const;

const stepCard = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "2.5rem",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
} as const;

const stepTitle = {
  fontSize: "1.3rem",
  fontWeight: 600,
  color: "#111827",
  marginBottom: "1.5rem",
} as const;

const required = {
  color: "#dc2626",
  fontSize: "0.9rem",
  fontWeight: 500,
} as const;

const navigation = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "600px",
  margin: "0 auto",
} as const;

const stepCounter = {
  fontWeight: 500,
  color: "#6b7280",
  fontSize: "0.95rem",
} as const;

const navButton = (type: string) =>
  ({
    padding: "0.875rem 2rem",
    borderRadius: "8px",
    fontWeight: 500,
    cursor: type === "disabled" ? "not-allowed" : "pointer",
    border: "none",
    opacity: type === "disabled" ? 0.5 : 1,
    ...(type === "primary"
      ? { backgroundColor: "#3db5e6", color: "#ffffff" }
      : type === "disabled"
      ? { backgroundColor: "#f3f4f6", color: "#9ca3af" }
      : {
          backgroundColor: "transparent",
          color: "#374151",
          border: "1px solid #d1d5db",
        }),
  } as any);

const searchContainer = { position: "relative", marginBottom: "2rem" } as const;

const searchIcon = {
  position: "absolute" as const,
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
} as const;

const searchInput = {
  width: "100%",
  padding: "0.875rem 1rem 0.875rem 3rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "0.95rem",
  transition: "border-color 0.2s",
} as const;

const patientList = { maxHeight: "400px", overflowY: "auto" } as const;

const patientCard = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  padding: "1.25rem",
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid #e5e7eb",
  transition: "all 0.2s",
  marginBottom: "0.5rem",
} as const;

const selectedPatientStyle = {
  borderColor: "#3db5e6",
  backgroundColor: "#f0f9ff",
  boxShadow: "0 0 0 3px rgba(59, 181, 230, 0.1)",
} as const;

const patientAvatar = {
  width: 48,
  height: 48,
  borderRadius: "12px",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  fontWeight: 600,
  fontSize: "1.1rem",
} as const;

const patientName = {
  fontWeight: 600,
  color: "#111827",
  marginBottom: "0.25rem",
} as const;

const patientPid = { fontSize: "0.85rem", color: "#6b7280" } as const;

const aiSummary = {
  fontSize: "0.8rem",
  color: "#3db5e6",
  marginLeft: "auto",
  fontStyle: "italic",
} as const;

const loadingText = {
  textAlign: "center" as const,
  padding: "2rem",
  color: "#6b7280",
} as const;

const vitalsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1.5rem",
} as const;

const formGrid = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
} as const;

const twoCol = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
} as const;

const formGroup = {
  display: "flex",
  flexDirection: "column",
} as const;

const formLabel = {
  fontSize: "0.85rem",
  color: "#374151",
  marginBottom: "0.5rem",
  fontWeight: 500,
} as const;

const formInput = {
  padding: "0.875rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "0.95rem",
  transition: "border-color 0.2s",
} as const;

const formTextarea = {
  ...formInput,
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
} as any;

const dropZone = {
  border: "2px dashed #d1d5db",
  borderRadius: "12px",
  padding: "3rem 2rem",
  textAlign: "center" as const,
  backgroundColor: "#fafbfc",
  transition: "border-color 0.2s",
} as const;

const dropIcon = {
  color: "#9ca3af",
  margin: "0 auto 1rem",
  display: "block",
} as const;

const dropTitle = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#111827",
  marginBottom: "0.5rem",
} as const;

const dropText = { color: "#6b7280", marginBottom: "2rem" } as const;

const browseButton = {
  padding: "0.75rem 2rem",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 500,
  transition: "background-color 0.2s",
} as const;

const imagePreview = { marginTop: "2rem" } as const;

const previewGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "1rem",
} as const;

const previewItem = { position: "relative" as const } as const;

const previewImage = {
  width: "100%",
  height: 100,
  objectFit: "cover" as const,
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
} as const;

const removeBtn = {
  position: "absolute" as const,
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
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
} as const;

const reviewGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1.5rem",
} as const;

const reviewSection = {
  backgroundColor: "#f8fafc",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
} as const;

const reviewValue = {
  fontWeight: 500,
  color: "#111827",
  margin: "0.25rem 0 0 0",
} as const;

const submitNote = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  backgroundColor: "#f0fdf4",
  padding: "1.5rem",
  borderRadius: "8px",
  marginTop: "2rem",
  color: "#166534",
  border: "1px solid #bbf7d0",
} as const;

const errorMessage = {
  backgroundColor: "#fee2e2",
  color: "#dc2626",
  padding: "1rem",
  borderRadius: "8px",
  borderLeft: "4px solid #ef4444",
  marginTop: "1rem",
  fontSize: "0.9rem",
} as const;
