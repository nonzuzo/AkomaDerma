import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Pill,
  FileText,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function ProvideMedication() {
  const [medications, setMedications] = useState([]);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [instructions, setInstructions] = useState("");
  const [precautions, setPrecautions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [currentMed, setCurrentMed] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "oral",
    instructions: "",
  });

  const caseData = {
    id: "CS-2024-001",
    patient: "Kwame Mensah, 45",
    diagnosis: "Melanoma",
    confidence: "High",
  };

  const addMedication = () => {
    if (
      !currentMed.name ||
      !currentMed.dosage ||
      !currentMed.frequency ||
      !currentMed.duration
    ) {
      alert("Please fill in all medication fields");
      return;
    }
    setMedications([...medications, { ...currentMed, id: Date.now() }]);
    setCurrentMed({
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      route: "oral",
      instructions: "",
    });
  };

  const removeMedication = (id) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleSubmit = () => {
    if (medications.length === 0 && !treatmentPlan.trim()) {
      alert("Please add at least one medication or provide a treatment plan");
      return;
    }
    if (!followUpDate) {
      alert("Please set a follow-up date");
      return;
    }

    console.log({
      medications,
      treatmentPlan,
      instructions,
      precautions,
      followUpDate,
      followUpInstructions,
      additionalNotes,
    });

    alert("Treatment plan submitted successfully! Case completed.");
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
      maxWidth: "1200px",
      margin: "0 auto",
    },
    pageHeader: {
      marginBottom: "2rem",
    },
    pageTitle: {
      fontSize: "1.875rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "0.5rem",
    },
    pageSubtitle: {
      color: "#64748b",
      fontSize: "1rem",
    },
    summaryBox: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "1.5rem",
      marginBottom: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "1rem",
    },
    summaryItem: {
      padding: "0.75rem",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
    },
    summaryLabel: {
      fontSize: "0.813rem",
      color: "#64748b",
      marginBottom: "0.25rem",
    },
    summaryValue: {
      fontSize: "0.95rem",
      fontWeight: "600",
      color: "#1e293b",
    },
    section: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "2rem",
      marginBottom: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
    },
    sectionTitle: {
      fontSize: "1.25rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    medicationForm: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "1.5rem",
      marginBottom: "1.5rem",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
      marginBottom: "1rem",
    },
    inputGroup: {
      marginBottom: "1rem",
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#334155",
      fontWeight: "500",
      fontSize: "0.9rem",
    },
    required: {
      color: "#ef4444",
      marginLeft: "0.25rem",
    },
    input: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "0.95rem",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    select: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "0.95rem",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    textarea: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "0.95rem",
      boxSizing: "border-box",
      fontFamily: "inherit",
      minHeight: "80px",
      resize: "vertical",
    },
    addButton: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#3db5e6",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.95rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      transition: "background-color 0.2s",
    },
    medicationList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    medicationCard: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "1.5rem",
      position: "relative",
    },
    medicationHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem",
    },
    medicationName: {
      fontSize: "1.125rem",
      fontWeight: "bold",
      color: "#1e293b",
    },
    removeButton: {
      padding: "0.25rem",
      backgroundColor: "#ef4444",
      color: "#ffffff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    medicationDetails: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "1rem",
      marginBottom: "0.75rem",
    },
    detailItem: {
      fontSize: "0.875rem",
    },
    detailLabel: {
      color: "#64748b",
      fontWeight: "500",
    },
    detailValue: {
      color: "#1e293b",
      fontWeight: "600",
    },
    medicationInstructions: {
      fontSize: "0.875rem",
      color: "#334155",
      fontStyle: "italic",
      paddingTop: "0.75rem",
      borderTop: "1px solid #e2e8f0",
    },
    emptyState: {
      textAlign: "center",
      padding: "2rem",
      color: "#94a3b8",
    },
    infoBox: {
      backgroundColor: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1.5rem",
      display: "flex",
      gap: "0.75rem",
      color: "#1e40af",
      fontSize: "0.9rem",
    },
    buttonGroup: {
      display: "flex",
      gap: "1rem",
      justifyContent: "flex-end",
      marginTop: "2rem",
    },
    button: {
      padding: "0.75rem 2rem",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      border: "none",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    cancelButton: {
      backgroundColor: "#ffffff",
      color: "#64748b",
      border: "1px solid #e2e8f0",
    },
    submitButton: {
      backgroundColor: "#10b981",
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
          onClick={() => alert("Navigate back to diagnosis review")}
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
          Back to Diagnosis
        </button>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Treatment & Medication Plan</h1>
          <p style={styles.pageSubtitle}>
            Prescribe medications and create treatment plan for the patient
          </p>
        </div>

        {/* Case Summary */}
        <div style={styles.summaryBox}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Case ID</div>
              <div style={styles.summaryValue}>{caseData.id}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Patient</div>
              <div style={styles.summaryValue}>{caseData.patient}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Diagnosis</div>
              <div style={styles.summaryValue}>{caseData.diagnosis}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Confidence</div>
              <div style={styles.summaryValue}>{caseData.confidence}</div>
            </div>
          </div>
        </div>

        {/* Medications Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Pill size={24} color="#3db5e6" />
            Medications
          </h2>

          <div style={styles.medicationForm}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#1e293b",
              }}
            >
              Add Medication
            </h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Medication Name<span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={currentMed.name}
                  onChange={(e) =>
                    setCurrentMed({ ...currentMed, name: e.target.value })
                  }
                  style={styles.input}
                  placeholder="e.g., Hydrocortisone cream"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Dosage<span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={currentMed.dosage}
                  onChange={(e) =>
                    setCurrentMed({ ...currentMed, dosage: e.target.value })
                  }
                  style={styles.input}
                  placeholder="e.g., 1% cream"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Frequency<span style={styles.required}>*</span>
                </label>
                <select
                  value={currentMed.frequency}
                  onChange={(e) =>
                    setCurrentMed({ ...currentMed, frequency: e.target.value })
                  }
                  style={styles.select}
                >
                  <option value="">Select frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="As needed">As needed</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Duration<span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={currentMed.duration}
                  onChange={(e) =>
                    setCurrentMed({ ...currentMed, duration: e.target.value })
                  }
                  style={styles.input}
                  placeholder="e.g., 2 weeks"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "1rem",
              }}
            >
              <div style={styles.inputGroup}>
                <label style={styles.label}>Route</label>
                <select
                  value={currentMed.route}
                  onChange={(e) =>
                    setCurrentMed({ ...currentMed, route: e.target.value })
                  }
                  style={styles.select}
                >
                  <option value="oral">Oral</option>
                  <option value="topical">Topical</option>
                  <option value="injection">Injection</option>
                  <option value="intravenous">Intravenous</option>
                  <option value="transdermal">Transdermal</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Special Instructions</label>
                <input
                  type="text"
                  value={currentMed.instructions}
                  onChange={(e) =>
                    setCurrentMed({
                      ...currentMed,
                      instructions: e.target.value,
                    })
                  }
                  style={styles.input}
                  placeholder="e.g., Apply to affected area after washing"
                />
              </div>
            </div>

            <button
              style={styles.addButton}
              onClick={addMedication}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#2a8fb5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#3db5e6")
              }
            >
              <Plus size={20} />
              Add Medication
            </button>
          </div>

          {/* Medication List */}
          {medications.length > 0 ? (
            <div style={styles.medicationList}>
              {medications.map((med) => (
                <div key={med.id} style={styles.medicationCard}>
                  <div style={styles.medicationHeader}>
                    <div style={styles.medicationName}>{med.name}</div>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeMedication(med.id)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#dc2626")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#ef4444")
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div style={styles.medicationDetails}>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Dosage</div>
                      <div style={styles.detailValue}>{med.dosage}</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Frequency</div>
                      <div style={styles.detailValue}>{med.frequency}</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Duration</div>
                      <div style={styles.detailValue}>{med.duration}</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Route</div>
                      <div style={styles.detailValue}>{med.route}</div>
                    </div>
                  </div>
                  {med.instructions && (
                    <div style={styles.medicationInstructions}>
                      Instructions: {med.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Pill
                size={48}
                color="#cbd5e1"
                style={{ margin: "0 auto 1rem" }}
              />
              <p>No medications added yet</p>
            </div>
          )}
        </div>

        {/* Treatment Plan */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FileText size={24} color="#3db5e6" />
            Treatment Plan
          </h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Overall Treatment Plan</label>
            <textarea
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              style={{ ...styles.textarea, minHeight: "120px" }}
              placeholder="Describe the overall treatment approach, procedures, lifestyle modifications, etc."
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Patient Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={styles.textarea}
              placeholder="Clear instructions for the patient on how to follow the treatment plan"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Precautions & Warnings</label>
            <textarea
              value={precautions}
              onChange={(e) => setPrecautions(e.target.value)}
              style={styles.textarea}
              placeholder="Important precautions, side effects to watch for, when to seek immediate care"
            />
          </div>
        </div>

        {/* Follow-up */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Calendar size={24} color="#3db5e6" />
            Follow-up Schedule
          </h2>

          <div style={styles.infoBox}>
            <Clock size={20} />
            <span>
              Setting a follow-up appointment ensures proper monitoring of the
              patient's progress
            </span>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Follow-up Date<span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                style={styles.input}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Follow-up Type</label>
              <select style={styles.select}>
                <option>In-person consultation</option>
                <option>Telemedicine follow-up</option>
                <option>Photo submission only</option>
                <option>Phone consultation</option>
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Follow-up Instructions</label>
            <textarea
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              style={styles.textarea}
              placeholder="What should the patient prepare or monitor before the follow-up?"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FileText size={24} color="#3db5e6" />
            Additional Notes
          </h2>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            style={{ ...styles.textarea, minHeight: "100px" }}
            placeholder="Any additional notes or comments for the patient or referring clinician"
          />
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.cancelButton }}
            onClick={() => alert("Cancel and return")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f8fafc")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ffffff")
            }
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.submitButton }}
            onClick={handleSubmit}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#059669")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#10b981")
            }
          >
            <Save size={20} />
            Complete Treatment Plan
          </button>
        </div>
      </main>
    </div>
  );
}
