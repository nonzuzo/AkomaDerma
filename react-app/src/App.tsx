import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./Components/LandingPage";
import SignUpPage from "./Components/Auth/SignUpPage";
import LoginPage from "./Components/Auth/LoginPage";
import LogoutPage from "./Components/Auth/LogoutPage";

// Admin imports

import PendingUsers from "./Components/Auth/PendingUsers";
import VerifyPasscode from "./Components/Auth/VerifyPasscode";

// Clinician imports
import ClinicianDashboard from "./Components/Clinician/ClinicianDashboardPage";
import ClinicianLayout from "./Components/Clinician/ClinicianLayoutPage";
import ClinicianAppointments from "./Components/Clinician/ClinicianAppointmentsPage";
import ClinicianPatients from "./Components/Clinician/ClinicianPatients";
import ClinicianCaseDetails from "./Components/Clinician/ClinicianCaseDetails";
import CreatePatientCase from "./Components/Clinician/ClinicianCreateCase";
import ClinicianMyCases from "./Components/Clinician/ClinicianMyCases";
import ClinicianPatientProfile from "./Components/Clinician/ClinicianPatientProfile";

// Dermatologist imports
import DermatologistDashboard from "./Components/Dermatologist/DermatologistDashboardPage";
import DermatologistCaseReview from "./Components/Dermatologist/CaseReviewPage";
import AIDiagnosisReview from "./Components/Dermatologist/AIDiagnosisAndDecisionPage";
import ProvideMedication from "./Components/Dermatologist/ProvideMedicatioPage";
import DermatologistLayout from "./Components/Dermatologist/DermatologistLayoutPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />

        {/* ADMIN ROUTES  */}

        <Route path="/admin" element={<PendingUsers />} />
        <Route path="/verify-passcode" element={<VerifyPasscode />} />

        <Route path="/clinician" element={<ClinicianLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClinicianDashboard />} />
          <Route path="appointments" element={<ClinicianAppointments />} />
          <Route path="patients" element={<ClinicianPatients />} />
          <Route path="cases" element={<ClinicianMyCases />} />
          <Route path="cases/:caseId" element={<ClinicianCaseDetails />} />
          <Route
            path="patients/:patientId"
            element={<ClinicianPatientProfile />}
          />
          <Route path="create-case" element={<CreatePatientCase />} />
        </Route>

        <Route path="/dermatologist" element={<DermatologistLayout />}>
          <Route
            index
            element={<Navigate to="/dermatologist/dashboard" replace />}
          />
          <Route path="dashboard" element={<DermatologistDashboard />} />
          <Route path="case/:id" element={<DermatologistCaseReview />} />
          <Route path="diagnosis/:id" element={<AIDiagnosisReview />} />
          <Route path="treatment/:id" element={<ProvideMedication />} />
        </Route>

        <Route
          path="*"
          element={
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h1>404 - Page Not Found</h1>
              <a href="/" style={{ color: "#3db5e6" }}>
                Go back home
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
