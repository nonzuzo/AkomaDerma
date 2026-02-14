// src/Components/Clinician/ClinicianCreateCase.tsx
import React, { useState } from "react";
import {
  User,
  Search,
  Calendar,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
} from "lucide-react";

const gradientTitleStyle = {
  fontSize: "2.5rem",
  fontWeight: "bold" as const,
  background: "linear-gradient(135deg, #3db5e6 0%, #1e40af 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  margin: 0,
  lineHeight: 1.2,
};

export default function ClinicianCreateCase() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patientPid: "",
    vitals: { bp: "", pulse: "", temp: "", weight: "", height: "" },
    chiefComplaint: "",
    lesionDuration: "",
    lesionLocation: "",
    symptoms: "",
    medications: "",
    allergies: "",
  });
  const [images, setImages] = useState([]);

  const patients = [
    {
      pid: "PID-000123",
      name: "John Doe",
      aiSummary: "Chronic tinea versicolor (3 recurrences)",
    },
    {
      pid: "PID-000456",
      name: "Grace Mensah",
      aiSummary: "Acne vulgaris - hormonal",
    },
  ];

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div style={pageContainer}>
      {/* UPDATED HEADER WITH GRADIENT TITLE */}
      <div style={header}>
        <h1 style={gradientTitleStyle}> Create New Case</h1> {/* GRADIENT! */}
        <p style={subtitle}>Complete dermatology case for specialist review</p>
      </div>

      {/* PROGRESS STEPPER */}
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

      {/* STEP CONTENT */}
      <div style={content}>
        {step === 1 && (
          <Step1
            patients={patients}
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}
        {step === 3 && <Step3 formData={formData} setFormData={setFormData} />}
        {step === 4 && <Step4 images={images} setImages={setImages} />}
        {step === 5 && <Step5 formData={formData} images={images} />}
      </div>

      {/* NAVIGATION */}
      <div style={navigation}>
        {step > 1 && (
          <button style={navButton("secondary")} onClick={prevStep}>
            <ArrowLeft size={16} /> Previous
          </button>
        )}
        <div style={stepCounter}>Step {step} of 5</div>
        <button
          style={navButton("primary")}
          onClick={step < 5 ? nextStep : () => alert("Case Submitted!")}
        >
          {step === 5 ? "Submit Case" : "Next"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// STEP COMPONENTS
function Step1({ patients, formData, setFormData }) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Select Patient</h2>
      <div style={searchContainer}>
        <Search size={18} style={searchIcon} />
        <input style={searchInput} placeholder="Search by name or PID..." />
      </div>
      <div style={patientList}>
        {patients.map((patient) => (
          <div
            key={patient.pid}
            style={patientCard}
            onClick={() =>
              setFormData({ ...formData, patientPid: patient.pid })
            }
          >
            <div style={patientAvatar}>{patient.name[0]}</div>
            <div>
              <div style={patientName}>{patient.name}</div>
              <div style={patientPid}>{patient.pid}</div>
            </div>
            <div style={aiSummary}>{patient.aiSummary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2({ formData, setFormData }) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Record Vitals</h2>
      <div style={vitalsGrid}>
        <FormInput
          label="Blood Pressure"
          value={formData.vitals.bp}
          onChange={(val) => updateVitals("bp", val, formData, setFormData)}
          placeholder="120/80"
        />
        <FormInput
          label="Pulse"
          value={formData.vitals.pulse}
          onChange={(val) => updateVitals("pulse", val, formData, setFormData)}
          placeholder="72 bpm"
        />
        <FormInput
          label="Temperature"
          value={formData.vitals.temp}
          onChange={(val) => updateVitals("temp", val, formData, setFormData)}
          placeholder="36.8°C"
        />
        <FormInput
          label="Weight"
          value={formData.vitals.weight}
          onChange={(val) => updateVitals("weight", val, formData, setFormData)}
          placeholder="70 kg"
        />
      </div>
    </div>
  );
}

function Step3({ formData, setFormData }) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Chief Complaint</h2>
      <div style={formGrid}>
        <FormInput
          label="Lesion Duration"
          value={formData.lesionDuration}
          onChange={(val) => setFormData({ ...formData, lesionDuration: val })}
          placeholder="3 weeks"
        />
        <FormInput
          label="Lesion Location"
          value={formData.lesionLocation}
          onChange={(val) => setFormData({ ...formData, lesionLocation: val })}
          placeholder="Chest, back"
        />
        <FormTextarea
          label="Chief Complaint *"
          value={formData.chiefComplaint}
          onChange={(val) => setFormData({ ...formData, chiefComplaint: val })}
          placeholder="Describe the main skin concern..."
        />
        <FormTextarea
          label="Additional Symptoms"
          value={formData.symptoms}
          onChange={(val) => setFormData({ ...formData, symptoms: val })}
          placeholder="Itching, pain, spreading pattern..."
        />
      </div>
    </div>
  );
}

function Step4({ images, setImages }) {
  const handleDrop = (e) => {
    e.preventDefault();
    setImages((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>
        Clinical Images <span style={required}>*Required</span>
      </h2>
      <div
        style={dropZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload size={48} style={dropIcon} />
        <h3 style={dropTitle}>Drag & drop images here</h3>
        <p style={dropText}>JPG, PNG (max 10MB total)</p>
        <input
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          id="imageUpload"
          onChange={(e) =>
            setImages((prev) => [...prev, ...Array.from(e.target.files)])
          }
        />
        <button
          style={browseButton}
          onClick={() => document.getElementById("imageUpload").click()}
        >
          Browse Files
        </button>
      </div>

      {images.length > 0 && (
        <div style={imagePreview}>
          <h4>{images.length} image(s) selected</h4>
          <div style={previewGrid}>
            {images.slice(0, 4).map((img, idx) => (
              <div key={idx} style={previewItem}>
                <img
                  src={URL.createObjectURL(img)}
                  style={previewImage}
                  alt=""
                />
                <button
                  style={removeBtn}
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
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

function Step5({ formData, images }) {
  return (
    <div style={stepCard}>
      <h2 style={stepTitle}>Review & Submit</h2>
      <div style={reviewGrid}>
        <div style={reviewSection}>
          <h3>Patient</h3>
          <p>{formData.patientPid || "Not selected"}</p>
        </div>
        <div style={reviewSection}>
          <h3>Vitals</h3>
          <p>
            {formData.vitals.bp || "N/A"} | {formData.vitals.weight || "N/A"}kg
          </p>
        </div>
        <div style={reviewSection}>
          <h3>Images</h3>
          <p>{images.length} photos</p>
        </div>
        <div style={reviewSection}>
          <h3>Complaint</h3>
          <p>{formData.chiefComplaint.slice(0, 100)}...</p>
        </div>
      </div>
      <div style={submitNote}>
        <CheckCircle size={20} style={{ color: "#10b981" }} />
        <span>
          This case will be analyzed by AI dermatology and assigned to
          specialist
        </span>
      </div>
    </div>
  );
}

// UTILITY COMPONENTS & FUNCTIONS
function FormInput({ label, value, onChange, placeholder }) {
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

function FormTextarea({ label, value, onChange, placeholder }) {
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

function updateVitals(field, value, formData, setFormData) {
  setFormData({
    ...formData,
    vitals: { ...formData.vitals, [field]: value },
  });
}

// ALL styles

const pageContainer = {
  padding: "2rem 0",
  maxWidth: "800px",
  margin: "0 auto",
} as const;

const header = {
  backgroundColor: "#ffffff",
  padding: "2rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "2rem",
} as const;

const title = {
  fontSize: "1.75rem",
  fontWeight: 600,
  color: "#111827",
  margin: 0,
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
} as const;

const stepItem = (active) =>
  ({ opacity: active ? 1 : 0.4, textAlign: "center" as const } as const);

const stepCircle = (active) =>
  ({
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: active ? "#3db5e6" : "#f3f4f6",
    color: active ? "#ffffff" : "#6b7280",
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontWeight: 600,
    marginBottom: "0.5rem",
  } as any);

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

const navButton = (type) =>
  ({
    padding: "0.875rem 2rem",
    borderRadius: "8px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    ...(type === "primary"
      ? { backgroundColor: "#3db5e6", color: "#ffffff" }
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
  border: "1px solid #d1d5db",
  borderRadius: "8px",
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
  ":hover": { borderColor: "#3db5e6", backgroundColor: "#f8fafc" },
} as any;

const patientAvatar = {
  width: 48,
  height: 48,
  borderRadius: "12px",
  backgroundColor: "#3db5e6",
  color: "#ffffff",
  display: "flex",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  fontWeight: 600,
} as const;

const patientName = { fontWeight: 600, color: "#111827" } as const;

const patientPid = { fontSize: "0.85rem", color: "#6b7280" } as const;

const aiSummary = {
  fontSize: "0.8rem",
  color: "#3db5e6",
  marginLeft: "auto",
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

const formGroup = {} as const;

const formLabel = {
  fontSize: "0.85rem",
  color: "#6b7280",
  marginBottom: "0.5rem",
  fontWeight: 500,
} as const;

const formInput = {
  padding: "0.875rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "0.95rem",
} as const;

const formTextarea = {
  ...(formInput as any),
  minHeight: "100px",
  resize: "vertical" as any,
} as const;

const dropZone = {
  border: "2px dashed #d1d5db",
  borderRadius: "12px",
  padding: "3rem 2rem",
  textAlign: "center" as const,
  backgroundColor: "#fafbfc",
} as const;

const dropIcon = {
  color: "#9ca3af",
  marginBottom: "1rem",
  display: "block",
  margin: "0 auto",
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
  objectFit: "cover",
  borderRadius: "8px",
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
} as const;
