import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Calendar,
  Activity,
  FileText,
  Image,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Brain,
  CheckCircle,
  XCircle,
  Edit3,
} from "lucide-react";

export default function DermatologistCaseReview() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageZoom, setImageZoom] = useState(100);

  // Mock data
  const caseData = {
    id: "CS-2024-001",
    status: "Pending Review",
    priority: "High",
    patient: {
      name: "Kwame Mensah",
      age: 45,
      gender: "Male",
      phone: "+233 24 123 4567",
      dateOfBirth: "1979-03-15",
    },
    submittedBy: "Dr. Sarah Johnson",
    submittedDate: "2024-01-07 14:30",
    caseInfo: {
      chiefComplaint:
        "Dark lesion on left arm that has been growing over the past 3 months",
      symptoms:
        "Irregular borders, color variation from brown to black, occasional itching",
      duration: "3 months",
      location: "Left upper arm, lateral aspect",
      size: "Approximately 8mm x 6mm",
      preliminaryDiagnosis: "Suspected Melanoma",
    },
    medicalHistory: {
      chronicConditions: "Hypertension (controlled)",
      familyHistory: "Father had skin cancer (basal cell carcinoma) at age 62",
      allergies: "No known drug allergies",
      currentMedications: "Lisinopril 10mg daily",
    },
    vitals: {
      bloodPressure: "130/85 mmHg",
      heartRate: "78 bpm",
      temperature: "36.8°C",
      weight: "82 kg",
      height: "175 cm",
    },
    lesionDetails: {
      location: "Left upper arm, lateral aspect",
      size: "8mm x 6mm",
      color: "Mixed: brown, black, with areas of red",
      texture: "Raised, irregular surface",
      duration: "3 months",
      painLevel: "2/10",
      itching: true,
      bleeding: false,
    },
    aiAnalysis: {
      diagnosis: "Melanoma",
      confidence: 92,
      differential: [
        { condition: "Melanoma", probability: 92 },
        { condition: "Dysplastic Nevus", probability: 6 },
        { condition: "Seborrheic Keratosis", probability: 2 },
      ],
      abcdScore: {
        asymmetry: "Present (2 points)",
        border: "Irregular (2 points)",
        color: "Multiple colors (2 points)",
        diameter: "> 6mm (1 point)",
        totalScore: "7/8 - High suspicion",
      },
    },
    images: [
      {
        id: 1,
        name: "lesion_closeup_1.jpg",
        type: "Close-up",
        date: "2024-01-07",
      },
      {
        id: 2,
        name: "lesion_wide_angle.jpg",
        type: "Wide angle",
        date: "2024-01-07",
      },
      {
        id: 3,
        name: "lesion_dermoscopy.jpg",
        type: "Dermoscopy",
        date: "2024-01-07",
      },
    ],
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    logo: {
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    backButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "transparent",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      cursor: "pointer",
      color: "#64748b",
      fontSize: "0.9rem",
      fontWeight: "500",
      transition: "all 0.2s",
    },
    mainContent: {
      padding: "2rem",
      maxWidth: "1600px",
      margin: "0 auto",
    },
    pageHeader: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "1.5rem 2rem",
      marginBottom: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    caseId: {
      fontFamily: "monospace",
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#3db5e6",
      marginBottom: "0.25rem",
    },
    patientName: {
      fontSize: "1.125rem",
      color: "#1e293b",
    },
    priorityBadge: {
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.875rem",
      fontWeight: "600",
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "2rem",
    },
    section: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
      marginBottom: "2rem",
    },
    sectionTitle: {
      fontSize: "1.125rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    imageViewer: {
      backgroundColor: "#1e293b",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1rem",
      minHeight: "400px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    imagePlaceholder: {
      color: "#94a3b8",
      textAlign: "center",
    },
    imageControls: {
      display: "flex",
      gap: "0.5rem",
      justifyContent: "center",
      marginBottom: "1rem",
    },
    controlButton: {
      padding: "0.5rem",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    thumbnails: {
      display: "flex",
      gap: "1rem",
      overflowX: "auto",
    },
    thumbnail: {
      minWidth: "100px",
      height: "100px",
      backgroundColor: "#e2e8f0",
      borderRadius: "8px",
      cursor: "pointer",
      border: "2px solid transparent",
      transition: "border-color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#94a3b8",
    },
    activeThumbnail: {
      borderColor: "#3db5e6",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
    },
    infoCard: {
      backgroundColor: "#f8fafc",
      padding: "1rem",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    label: {
      fontSize: "0.813rem",
      color: "#64748b",
      marginBottom: "0.25rem",
      fontWeight: "500",
    },
    value: {
      fontSize: "0.95rem",
      color: "#1e293b",
      fontWeight: "600",
    },
    textBlock: {
      backgroundColor: "#f8fafc",
      padding: "1rem",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      color: "#334155",
      fontSize: "0.95rem",
      lineHeight: "1.6",
      marginBottom: "1rem",
    },
    aiSection: {
      backgroundColor: "#f0f9ff",
      border: "2px solid #3db5e6",
      borderRadius: "12px",
      padding: "1.5rem",
    },
    aiHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "1rem",
    },
    aiTitle: {
      fontSize: "1.125rem",
      fontWeight: "bold",
      color: "#0369a1",
    },
    confidenceBar: {
      marginBottom: "1.5rem",
    },
    confidenceLabel: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "0.5rem",
      fontSize: "0.875rem",
    },
    progressBar: {
      width: "100%",
      height: "12px",
      backgroundColor: "#e0f2fe",
      borderRadius: "6px",
      overflow: "hidden",
    },
    progress: {
      height: "100%",
      backgroundColor: "#3db5e6",
      transition: "width 0.3s",
    },
    differentialList: {
      marginBottom: "1.5rem",
    },
    differentialItem: {
      display: "flex",
      justifyContent: "space-between",
      padding: "0.75rem",
      backgroundColor: "#ffffff",
      borderRadius: "6px",
      marginBottom: "0.5rem",
    },
    abcdGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.75rem",
    },
    abcdItem: {
      backgroundColor: "#ffffff",
      padding: "0.75rem",
      borderRadius: "6px",
    },
    abcdLabel: {
      fontSize: "0.813rem",
      fontWeight: "600",
      color: "#0369a1",
      marginBottom: "0.25rem",
    },
    abcdValue: {
      fontSize: "0.875rem",
      color: "#334155",
    },
    actionButtons: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      marginTop: "2rem",
    },
    actionButton: {
      padding: "1rem",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.95rem",
      fontWeight: "600",
      transition: "all 0.2s",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
    },
    acceptButton: {
      backgroundColor: "#10b981",
      color: "#ffffff",
    },
    alterButton: {
      backgroundColor: "#f59e0b",
      color: "#ffffff",
    },
    denyButton: {
      backgroundColor: "#ef4444",
      color: "#ffffff",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: "#3db5e6" }}>Akoma</span>
          <span style={{ color: "#000" }}>Derma</span>
        </div>
        <button
          style={styles.backButton}
          onClick={() => alert("Navigate back to dashboard")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#3db5e6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </header>

      <main style={styles.mainContent}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.caseId}>{caseData.id}</div>
            <div style={styles.patientName}>
              {caseData.patient.name}, {caseData.patient.age} •{" "}
              {caseData.patient.gender}
            </div>
          </div>
          <div
            style={{
              ...styles.priorityBadge,
              backgroundColor: "#fee2e2",
              color: "#ef4444",
            }}
          >
            High Priority
          </div>
        </div>

        <div style={styles.contentGrid}>
          {/* Left Column - Images */}
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <Image size={20} color="#3db5e6" />
                Lesion Images
              </h3>

              <div style={styles.imageViewer}>
                <div style={styles.imagePlaceholder}>
                  <Image size={64} />
                  <p style={{ marginTop: "1rem" }}>
                    {caseData.images[selectedImage].type}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                    {caseData.images[selectedImage].name}
                  </p>
                </div>
              </div>

              <div style={styles.imageControls}>
                <button
                  style={styles.controlButton}
                  onClick={() => setImageZoom(Math.max(50, imageZoom - 25))}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  style={styles.controlButton}
                  onClick={() => setImageZoom(100)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  {imageZoom}%
                </button>
                <button
                  style={styles.controlButton}
                  onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  style={styles.controlButton}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  <RotateCw size={18} />
                </button>
                <button
                  style={styles.controlButton}
                  onClick={() => alert("Download image")}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  <Download size={18} />
                </button>
              </div>

              <div style={styles.thumbnails}>
                {caseData.images.map((img, index) => (
                  <div
                    key={img.id}
                    style={{
                      ...styles.thumbnail,
                      ...(selectedImage === index
                        ? styles.activeThumbnail
                        : {}),
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <div style={{ textAlign: "center", fontSize: "0.75rem" }}>
                      <Image size={32} />
                      <div style={{ marginTop: "0.25rem" }}>{img.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lesion Details */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <FileText size={20} color="#3db5e6" />
                Lesion Details
              </h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Location</div>
                  <div style={styles.value}>
                    {caseData.lesionDetails.location}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Size</div>
                  <div style={styles.value}>{caseData.lesionDetails.size}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Color</div>
                  <div style={styles.value}>{caseData.lesionDetails.color}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Texture</div>
                  <div style={styles.value}>
                    {caseData.lesionDetails.texture}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Duration</div>
                  <div style={styles.value}>
                    {caseData.lesionDetails.duration}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Pain Level</div>
                  <div style={styles.value}>
                    {caseData.lesionDetails.painLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div>
            {/* AI Analysis */}
            <div style={styles.aiSection}>
              <div style={styles.aiHeader}>
                <Brain size={24} color="#0369a1" />
                <div style={styles.aiTitle}>AI Analysis</div>
              </div>

              <div style={styles.confidenceBar}>
                <div style={styles.confidenceLabel}>
                  <span style={{ fontWeight: "600", color: "#0369a1" }}>
                    Diagnosis: {caseData.aiAnalysis.diagnosis}
                  </span>
                  <span style={{ fontWeight: "600", color: "#0369a1" }}>
                    {caseData.aiAnalysis.confidence}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progress,
                      width: `${caseData.aiAnalysis.confidence}%`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.differentialList}>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0369a1",
                    marginBottom: "0.75rem",
                  }}
                >
                  Differential Diagnosis:
                </div>
                {caseData.aiAnalysis.differential.map((item, index) => (
                  <div key={index} style={styles.differentialItem}>
                    <span>{item.condition}</span>
                    <span style={{ fontWeight: "600", color: "#0369a1" }}>
                      {item.probability}%
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0369a1",
                    marginBottom: "0.75rem",
                  }}
                >
                  ABCD Score:
                </div>
                <div style={styles.abcdGrid}>
                  <div style={styles.abcdItem}>
                    <div style={styles.abcdLabel}>Asymmetry</div>
                    <div style={styles.abcdValue}>
                      {caseData.aiAnalysis.abcdScore.asymmetry}
                    </div>
                  </div>
                  <div style={styles.abcdItem}>
                    <div style={styles.abcdLabel}>Border</div>
                    <div style={styles.abcdValue}>
                      {caseData.aiAnalysis.abcdScore.border}
                    </div>
                  </div>
                  <div style={styles.abcdItem}>
                    <div style={styles.abcdLabel}>Color</div>
                    <div style={styles.abcdValue}>
                      {caseData.aiAnalysis.abcdScore.color}
                    </div>
                  </div>
                  <div style={styles.abcdItem}>
                    <div style={styles.abcdLabel}>Diameter</div>
                    <div style={styles.abcdValue}>
                      {caseData.aiAnalysis.abcdScore.diameter}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    backgroundColor: "#fee2e2",
                    borderRadius: "6px",
                    color: "#991b1b",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    textAlign: "center",
                  }}
                >
                  {caseData.aiAnalysis.abcdScore.totalScore}
                </div>
              </div>
            </div>

            {/* Case Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <FileText size={20} color="#3db5e6" />
                Case Information
              </h3>
              <div style={{ marginBottom: "1rem" }}>
                <div style={styles.label}>Chief Complaint</div>
                <div style={styles.textBlock}>
                  {caseData.caseInfo.chiefComplaint}
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={styles.label}>Symptoms</div>
                <div style={styles.textBlock}>{caseData.caseInfo.symptoms}</div>
              </div>
            </div>

            {/* Patient Vitals */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <Activity size={20} color="#3db5e6" />
                Vital Signs
              </h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Blood Pressure</div>
                  <div style={styles.value}>
                    {caseData.vitals.bloodPressure}
                  </div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Heart Rate</div>
                  <div style={styles.value}>{caseData.vitals.heartRate}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Temperature</div>
                  <div style={styles.value}>{caseData.vitals.temperature}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.label}>Weight</div>
                  <div style={styles.value}>{caseData.vitals.weight}</div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <User size={20} color="#3db5e6" />
                Medical History
              </h3>
              <div style={{ marginBottom: "1rem" }}>
                <div style={styles.label}>Chronic Conditions</div>
                <div style={styles.textBlock}>
                  {caseData.medicalHistory.chronicConditions}
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={styles.label}>Family History</div>
                <div style={styles.textBlock}>
                  {caseData.medicalHistory.familyHistory}
                </div>
              </div>
              <div>
                <div style={styles.label}>Allergies</div>
                <div style={styles.textBlock}>
                  {caseData.medicalHistory.allergies}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button
            style={{ ...styles.actionButton, ...styles.acceptButton }}
            onClick={() => alert("Accept AI diagnosis")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#059669")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#10b981")
            }
          >
            <CheckCircle size={24} />
            Accept AI Diagnosis
          </button>
          <button
            style={{ ...styles.actionButton, ...styles.alterButton }}
            onClick={() => alert("Alter diagnosis")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#d97706")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#f59e0b")
            }
          >
            <Edit3 size={24} />
            Alter Diagnosis
          </button>
          <button
            style={{ ...styles.actionButton, ...styles.denyButton }}
            onClick={() => alert("Deny and provide new diagnosis")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#dc2626")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ef4444")
            }
          >
            <XCircle size={24} />
            Deny & Provide New
          </button>
        </div>
      </main>
    </div>
  );
}
