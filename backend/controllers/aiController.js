import db from "../config/db.js";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate complete patient profile for dermatologist review
 * Pulls ALL patient history + generates fresh AI clinical assessment
 */
export const generatePatientProfile = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    console.log(`🔍 Generating AI Profile for Patient ID: ${patientId}`);

    // FIXED SQL - Uses subqueries to avoid ONLY_FULL_GROUP_BY error
    const [patients] = await db.execute(
      `
      SELECT 
        p.patient_id, p.first_name, p.last_name, p.date_of_birth, p.sex as gender, p.contact_info,
        -- Current ACTIVE case (subquery avoids GROUP BY conflict)
        (SELECT c.chief_complaint FROM cases c WHERE c.patient_id = p.patient_id AND c.status != 'completed' LIMIT 1) as chief_complaint,
        (SELECT c.lesion_location FROM cases c WHERE c.patient_id = p.patient_id AND c.status != 'completed' LIMIT 1) as lesion_location,
        (SELECT c.lesion_duration FROM cases c WHERE c.patient_id = p.patient_id AND c.status != 'completed' LIMIT 1) as lesion_duration,
        (SELECT c.symptoms FROM cases c WHERE c.patient_id = p.patient_id AND c.status != 'completed' LIMIT 1) as symptoms,
        (SELECT c.status FROM cases c WHERE c.patient_id = p.patient_id AND c.status != 'completed' LIMIT 1) as case_status,
        -- Patient history from YOUR tables
        ps.summary_text as prior_summary,
        GROUP_CONCAT(DISTINCT pc.condition_name SEPARATOR '; ') as conditions,
        GROUP_CONCAT(DISTINCT pc.severity SEPARATOR '; ') as severities,
        GROUP_CONCAT(DISTINCT d.final_diagnosis SEPARATOR '; ') as diagnoses,
        GROUP_CONCAT(DISTINCT tp.medications SEPARATOR '; ') as past_medications
      FROM patients p 
      LEFT JOIN patient_summaries ps ON p.patient_id = ps.patient_id
      LEFT JOIN patient_conditions pc ON p.patient_id = pc.patient_id
      LEFT JOIN cases c2 ON p.patient_id = c2.patient_id
      LEFT JOIN diagnoses d ON c2.case_id = d.case_id  
      LEFT JOIN treatment_plans tp ON d.diagnosis_id = tp.diagnosis_id
      WHERE p.patient_id = ?
      GROUP BY 
        p.patient_id, p.first_name, p.last_name, p.date_of_birth, 
        p.sex, p.contact_info, ps.summary_text
    `,
      [patientId]
    );

    if (patients.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patient = patients[0];

    // Calculate age from birthdate
    const age = patient.date_of_birth
      ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
      : "N/A";

    // LLM generates FRESH clinical assessment
    const prompt = `**DERMATOLOGIST PATIENT DOSSIER**

PATIENT: ${patient.first_name} ${patient.last_name}
Age: ${age} | Gender: ${patient.gender || "N/A"} | Contact: ${
      patient.contact_info || "N/A"
    }

CURRENT CASE:
• Chief Complaint: ${patient.chief_complaint || "New patient evaluation"}
• Lesion Location: ${patient.lesion_location || "N/A"}
• Duration: ${patient.lesion_duration || "N/A"}
• Symptoms: ${patient.symptoms || "N/A"}
• Status: ${patient.case_status || "No active case"}

MEDICAL HISTORY:
• Conditions: ${patient.conditions || "None recorded"}
• Condition Severities: ${patient.severities || "N/A"}
• Past Diagnoses: ${patient.diagnoses || "None"}
• Past Medications: ${patient.past_medications || "None"}
• Prior Summary: ${patient.prior_summary || "None"}

TASK: Generate clinical assessment with:
- Risk assessment
- Differential diagnosis (3 options)
- Recommended investigations  
- Treatment recommendations
- Follow-up plan

FORMAT: Professional medical bullet points ONLY.`;

    console.log("🤖 Calling OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    console.log("AI Profile generated successfully!");

    res.json({
      success: true,
      patient_id: patientId,
      full_name: `${patient.first_name} ${patient.last_name}`,
      demographics: {
        age,
        gender: patient.gender || "N/A",
        contact: patient.contact_info || "N/A",
      },
      current_case: {
        chief_complaint: patient.chief_complaint || "None",
        lesion_location: patient.lesion_location || "N/A",
        lesion_duration: patient.lesion_duration || "N/A",
        symptoms: patient.symptoms || "N/A",
        status: patient.case_status || "No active case",
      },
      medical_history: {
        conditions: patient.conditions || "None recorded",
        severities: patient.severities || "N/A",
        diagnoses: patient.diagnoses || "None recorded",
        medications: patient.past_medications || "None recorded",
      },
      // FRESH LLM-GENERATED assessment (not from DB)
      ai_clinical_assessment: completion.choices[0].message.content,
      dermatologist_packet: true,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(" AI Profile ERROR:", error.message);
    res.status(500).json({
      error: "Profile generation failed",
      details: error.message,
    });
  }
};
