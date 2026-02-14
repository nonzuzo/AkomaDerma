import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Brain,
  CheckCircle,
  XCircle,
  Edit3,
  AlertCircle,
  TrendingUp,
  FileText,
  ArrowRight,
  Info,
} from "lucide-react";

export default function AIDiagnosisReview() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState<"accept" | "alter" | "deny" | null>(
    null
  );
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState("Malignant Melanoma");
  const [reasoning, setReasoning] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Mock data
  const aiAnalysis = {
    primaryDiagnosis: "Malignant Melanoma",
    confidence: 0.89,
    modelVersion: "DermAI v3.2.1",
    analysisDate: "2024-01-07 09:35",

    differential: [
      {
        condition: "Malignant Melanoma",
        probability: 0.89,
        icd10: "C43.6",
        description: "Malignant neoplasm of skin",
      },
      {
        condition: "Atypical Nevus (Dysplastic Nevus)",
        probability: 0.07,
        icd10: "D22.6",
        description: "Benign neoplasm, may progress to melanoma",
      },
      {
        condition: "Seborrheic Keratosis",
        probability: 0.03,
        icd10: "L82.1",
        description: "Benign skin growth",
      },
      {
        condition: "Basal Cell Carcinoma",
        probability: 0.01,
        icd10: "C44.319",
        description: "Most common skin cancer",
      },
    ],

    clinicalFeatures: [
      {
        feature: "Asymmetry",
        present: true,
        weight: "High",
        description: "Lesion is asymmetrical in multiple axes",
      },
      {
        feature: "Border Irregularity",
        present: true,
        weight: "High",
        description: "Notched, irregular borders observed",
      },
      {
        feature: "Color Variation",
        present: true,
        weight: "High",
        description: "Multiple colors present: brown, black, red",
      },
      {
        feature: "Diameter",
        present: true,
        weight: "Medium",
        description: "Diameter 12-15mm (>6mm threshold)",
      },
      {
        feature: "Evolution",
        present: true,
        weight: "High",
        description: "Recent changes in size and color reported",
      },
    ],

    riskFactors: [
      { factor: "Age > 40", present: true, impact: "High" },
      { factor: "Male gender", present: true, impact: "Medium" },
      {
        factor: "Family history of melanoma",
        present: true,
        impact: "Very High",
      },
      { factor: "Fair skin type", present: true, impact: "High" },
      { factor: "History of sunburns", present: true, impact: "Medium" },
    ],

    recommendations: [
      "Urgent biopsy recommended (excisional preferred)",
      "Sentinel lymph node evaluation if melanoma confirmed",
      "Full body skin examination",
      "Genetic counseling due to family history",
      "Patient education on sun protection",
    ],

    evidenceBase: [
      {
        source: "ABCDE Criteria Analysis",
        finding: "5/5 criteria met",
        reference: "American Academy of Dermatology Guidelines",
      },
      {
        source: "Dermoscopic Pattern Analysis",
        finding: "Irregular pigment network, blue-white veil",
        reference: "7-point checklist score: 6/7",
      },
      {
        source: "Risk Stratification",
        finding: "High-risk profile",
        reference: "Melanoma Risk Assessment Tool",
      },
    ],

    similarCases: [
      {
        id: "CS-2024-045",
        similarity: 0.92,
        finalDiagnosis: "Malignant Melanoma",
        outcome: "Stage IIA, successful excision",
        dermatologistNotes: "Similar presentation, biopsy confirmed",
      },
      {
        id: "CS-2024-062",
        similarity: 0.88,
        finalDiagnosis: "Malignant Melanoma",
        outcome: "Stage IB, wide local excision + sentinel node",
        dermatologistNotes: "ABCDE criteria match, positive family history",
      },
      {
        id: "CS-2023-198",
        similarity: 0.85,
        finalDiagnosis: "Atypical Nevus",
        outcome: "Prophylactic excision, benign pathology",
        dermatologistNotes: "Initially concerning but histology benign",
      },
    ],
  };

  const commonDiagnoses = [
    "Malignant Melanoma",
    "Basal Cell Carcinoma",
    "Squamous Cell Carcinoma",
    "Atypical Nevus",
    "Seborrheic Keratosis",
    "Actinic Keratosis",
    "Dermatofibroma",
    "Hemangioma",
    "Other (specify in notes)",
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "#10b981";
    if (confidence >= 0.7) return "#f59e0b";
    return "#ef4444";
  };

  const handleSubmitDecision = () => {
    if (!decision) {
      alert("Please select a decision (Accept, Alter, or Deny)");
      return;
    }

    if (decision === "alter" && !selectedDiagnosis) {
      alert("Please select an alternative diagnosis");
      return;
    }

    if (!reasoning.trim()) {
      alert("Please provide your clinical reasoning");
      return;
    }

    // In real app, submit to backend
    console.log({
      caseId,
      decision,
      selectedDiagnosis,
      reasoning,
      additionalNotes,
    });

    // Navigate to medication page
    navigate(`/dermatologist/cases/${caseId}/medication`);
  };

  const styles = {
    container: {
      maxWidth: "1400px",
      margin: "0 auto",
    },
    header: {
      backgroundColor: "#ffffff",
      padding: "1.5rem",
      borderRadius: "12px",
      marginBottom: "1.5rem",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    pageTitle: {
      fontSize: "1.875rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "0.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    subtitle: {
      color: "#64748b",
      fontSize: "1rem",
    },
    mainGrid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "1.5rem",
    },
    section: {
      backgroundColor: "#ffffff",
      padding: "1.5rem",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      marginBottom: "1.5rem",
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
    aiCard: {
      backgroundColor: "#f8fafc",
      padding: "1.5rem",
      borderRadius: "12px",
      border: "2px solid #8b5cf6",
      marginBottom: "1.5rem",
    },
    diagnosisText: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "1rem",
    },
    confidenceDisplay: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "1rem",
    },
    confidenceBar: {
      flex: 1,
      height: "16px",
      backgroundColor: "#e2e8f0",
      borderRadius: "8px",
      overflow: "hidden",
    },
    confidenceFill: {
      height: "100%",
      transition: "width 0.3s",
    },
    confidenceText: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      minWidth: "60px",
    },
    decisionButtons: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      marginBottom: "1.5rem",
    },
    decisionButton: {
      padding: "1.5rem",
      border: "2px solid #e2e8f0",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s",
      textAlign: "center" as const,
      backgroundColor: "#ffffff",
    },
    decisionButtonActive: {
      border: "2px solid",
      backgroundColor: "#f8fafc",
    },
    decisionIcon: {
      marginBottom: "0.75rem",
      display: "flex",
      justifyContent: "center",
    },
    decisionLabel: {
      fontSize: "1.125rem",
      fontWeight: "600",
      marginBottom: "0.5rem",
    },
    decisionDescription: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
    differentialList: {
      marginTop: "1rem",
    },
    differentialItem: {
      padding: "1rem",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      marginBottom: "0.75rem",
      border: "1px solid #e2e8f0",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    differentialHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.5rem",
    },
    featureList: {
      display: "grid",
      gap: "0.75rem",
    },
    featureItem: {
      padding: "1rem",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    featureInfo: {
      flex: 1,
    },
    featureName: {
      fontWeight: "600",
      marginBottom: "0.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    featureDescription: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
    badge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: "600",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontWeight: "600",
      marginBottom: "0.5rem",
      color: "#1e293b",
    },
    select: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "1rem",
      backgroundColor: "#ffffff",
      cursor: "pointer",
    },
    textarea: {
      width: "100%",
      minHeight: "150px",
      padding: "0.75rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "0.95rem",
      fontFamily: "inherit",
      resize: "vertical" as const,
      boxSizing: "border-box" as const,
    },
    infoBox: {
      backgroundColor: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "8px",
      padding: "1rem",
      display: "flex",
      gap: "0.75rem",
      fontSize: "0.875rem",
      color: "#1e40af",
      marginBottom: "1rem",
    },
    list: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    listItem: {
      padding: "0.75rem",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "0.875rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.5rem",
    },
    caseCard: {
      padding: "1rem",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      marginBottom: "0.75rem",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    submitButton: {
      width: "100%",
      padding: "1.25rem",
      backgroundColor: "#8b5cf6",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "1.125rem",
      fontWeight: "600",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>
          <Brain size={32} color="#8b5cf6" />
          AI Diagnosis Review
        </h1>
        <p style={styles.subtitle}>
          Case {caseId} - Review and make your clinical decision
        </p>
      </div>

      <div style={styles.mainGrid}>
        {/* Left Column - AI Analysis */}
        <div>
          {/* AI Diagnosis */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Brain size={20} color="#8b5cf6" />
              AI Primary Diagnosis
            </h2>

            <div style={styles.aiCard}>
              <div style={styles.diagnosisText}>
                {aiAnalysis.primaryDiagnosis}
              </div>

              <div style={styles.confidenceDisplay}>
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    minWidth: "80px",
                  }}
                >
                  Confidence:
                </span>
                <div style={styles.confidenceBar}>
                  <div
                    style={{
                      ...styles.confidenceFill,
                      width: `${aiAnalysis.confidence * 100}%`,
                      backgroundColor: getConfidenceColor(
                        aiAnalysis.confidence
                      ),
                    }}
                  />
                </div>
                <div
                  style={{
                    ...styles.confidenceText,
                    color: getConfidenceColor(aiAnalysis.confidence),
                  }}
                >
                  {(aiAnalysis.confidence * 100).toFixed(0)}%
                </div>
              </div>

              <div style={{ fontSize: "0.813rem", color: "#64748b" }}>
                Model: {aiAnalysis.modelVersion} • Analyzed:{" "}
                {aiAnalysis.analysisDate}
              </div>
            </div>

            <div style={styles.infoBox}>
              <Info size={20} />
              <div>
                This AI diagnosis is based on image analysis, clinical features,
                and risk factors. Your expert clinical judgment is essential for
                final diagnosis and treatment planning.
              </div>
            </div>
          </div>

          {/* Differential Diagnoses */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FileText size={20} />
              Differential Diagnoses
            </h2>

            <div style={styles.differentialList}>
              {aiAnalysis.differential.map((item, index) => (
                <div
                  key={index}
                  style={styles.differentialItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <div style={styles.differentialHeader}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "1rem" }}>
                        {item.condition}
                      </div>
                      <div
                        style={{
                          fontSize: "0.813rem",
                          color: "#64748b",
                          marginTop: "0.25rem",
                        }}
                      >
                        ICD-10: {item.icd10}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: getConfidenceColor(item.probability),
                      }}
                    >
                      {(item.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginTop: "0.5rem",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Features */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <TrendingUp size={20} />
              Clinical Features (ABCDE Analysis)
            </h2>

            <div style={styles.featureList}>
              {aiAnalysis.clinicalFeatures.map((feature, index) => (
                <div key={index} style={styles.featureItem}>
                  <div style={styles.featureInfo}>
                    <div style={styles.featureName}>
                      {feature.present ? (
                        <CheckCircle size={18} color="#10b981" />
                      ) : (
                        <XCircle size={18} color="#64748b" />
                      )}
                      {feature.feature}
                    </div>
                    <div style={styles.featureDescription}>
                      {feature.description}
                    </div>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor:
                        feature.weight === "High"
                          ? "#ef444415"
                          : feature.weight === "Medium"
                          ? "#f59e0b15"
                          : "#10b98115",
                      color:
                        feature.weight === "High"
                          ? "#ef4444"
                          : feature.weight === "Medium"
                          ? "#f59e0b"
                          : "#10b981",
                    }}
                  >
                    {feature.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <AlertCircle size={20} color="#f59e0b" />
              AI Recommendations
            </h2>

            <ul style={styles.list}>
              {aiAnalysis.recommendations.map((rec, index) => (
                <li key={index} style={styles.listItem}>
                  <span style={{ color: "#f59e0b" }}>▸</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column - Decision Making */}
        <div>
          {/* Decision Panel */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Clinical Decision</h2>

            <div style={styles.decisionButtons}>
              {[
                {
                  type: "accept" as const,
                  icon: CheckCircle,
                  label: "Accept",
                  description: "Agree with AI diagnosis",
                  color: "#10b981",
                },
                {
                  type: "alter" as const,
                  icon: Edit3,
                  label: "Alter",
                  description: "Modify the diagnosis",
                  color: "#f59e0b",
                },
                {
                  type: "deny" as const,
                  icon: XCircle,
                  label: "Deny",
                  description: "Disagree with AI",
                  color: "#ef4444",
                },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = decision === option.type;

                return (
                  <div
                    key={option.type}
                    style={{
                      ...styles.decisionButton,
                      ...(isActive
                        ? {
                            ...styles.decisionButtonActive,
                            borderColor: option.color,
                          }
                        : {}),
                    }}
                    onClick={() => setDecision(option.type)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = option.color;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <div style={styles.decisionIcon}>
                      <Icon
                        size={32}
                        color={isActive ? option.color : "#64748b"}
                      />
                    </div>
                    <div
                      style={{
                        ...styles.decisionLabel,
                        color: isActive ? option.color : "#1e293b",
                      }}
                    >
                      {option.label}
                    </div>
                    <div style={styles.decisionDescription}>
                      {option.description}
                    </div>
                  </div>
                );
              })}
            </div>

            {decision === "alter" && (
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Select Alternative Diagnosis *
                </label>
                <select
                  style={styles.select}
                  value={selectedDiagnosis}
                  onChange={(e) => setSelectedDiagnosis(e.target.value)}
                >
                  {commonDiagnoses.map((diagnosis) => (
                    <option key={diagnosis} value={diagnosis}>
                      {diagnosis}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Clinical Reasoning *
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: "normal",
                    color: "#64748b",
                    marginLeft: "0.5rem",
                  }}
                >
                  (Required)
                </span>
              </label>
              <textarea
                style={styles.textarea}
                placeholder="Provide your clinical reasoning for this decision. Include relevant clinical findings, differential considerations, and rationale..."
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Additional Notes
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: "normal",
                    color: "#64748b",
                    marginLeft: "0.5rem",
                  }}
                >
                  (Optional)
                </span>
              </label>
              <textarea
                style={styles.textarea}
                placeholder="Add any additional observations, follow-up requirements, or special considerations..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            <button
              style={styles.submitButton}
              onClick={handleSubmitDecision}
              disabled={!decision || !reasoning.trim()}
              onMouseEnter={(e) => {
                if (decision && reasoning.trim()) {
                  e.currentTarget.style.backgroundColor = "#7c3aed";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#8b5cf6";
              }}
            >
              Continue to Treatment Plan
              <ArrowRight size={24} />
            </button>
          </div>

          {/* Similar Cases */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Similar Cases in Database</h2>

            {aiAnalysis.similarCases.map((caseItem, index) => (
              <div
                key={index}
                style={styles.caseCard}
                onClick={() => navigate(`/dermatologist/cases/${caseItem.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#8b5cf6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: "600",
                      color: "#8b5cf6",
                    }}
                  >
                    {caseItem.id}
                  </span>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: "#10b98115",
                      color: "#10b981",
                    }}
                  >
                    {(caseItem.similarity * 100).toFixed(0)}% match
                  </span>
                </div>
                <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                  {caseItem.finalDiagnosis}
                </div>
                <div
                  style={{
                    fontSize: "0.813rem",
                    color: "#64748b",
                    marginBottom: "0.5rem",
                  }}
                >
                  {caseItem.outcome}
                </div>
                <div
                  style={{
                    fontSize: "0.813rem",
                    color: "#64748b",
                    fontStyle: "italic",
                  }}
                >
                  "{caseItem.dermatologistNotes}"
                </div>
              </div>
            ))}
          </div>

          {/* Risk Factors */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Patient Risk Factors</h2>

            <ul style={styles.list}>
              {aiAnalysis.riskFactors.map((risk, index) => (
                <li key={index} style={styles.listItem}>
                  {risk.present ? (
                    <CheckCircle size={16} color="#ef4444" />
                  ) : (
                    <XCircle size={16} color="#64748b" />
                  )}
                  <div style={{ flex: 1 }}>
                    <span>{risk.factor}</span>
                    {risk.present && (
                      <span
                        style={{
                          ...styles.badge,
                          marginLeft: "0.5rem",
                          backgroundColor: "#ef444415",
                          color: "#ef4444",
                        }}
                      >
                        {risk.impact} Risk
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
