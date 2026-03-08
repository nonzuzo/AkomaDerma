// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./Components/LandingPage";
import SignUpPage from "./Components/Auth/SignUpPage";
import LoginPage from "./Components/Auth/LoginPage";
import LogoutPage from "./Components/Auth/LogoutPage";
import ForgotPasswordPage from "./Components/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./Components/Auth/ResetPasswordPage";

// Admin
import PendingUsers from "./Components/Auth/PendingUsers";
import VerifyPasscode from "./Components/Auth/VerifyPasscode";

// Clinician
import ClinicianLayout from "./Components/Clinician/ClinicianLayoutPage";
import ClinicianDashboard from "./Components/Clinician/ClinicianDashboardPage";
import ClinicianAppointments from "./Components/Clinician/ClinicianAppointmentsPage";
import ClinicianPatients from "./Components/Clinician/ClinicianPatients";
import ClinicianCaseDetails from "./Components/Clinician/ClinicianCaseDetails";
import CreatePatientCase from "./Components/Clinician/ClinicianCreateCase";
import ClinicianMyCases from "./Components/Clinician/ClinicianMyCases";
import ClinicianPatientProfile from "./Components/Clinician/ClinicianPatientProfile";
import BillingNewPage from "./Components/Clinician/BillingPage";

// Dermatologist
import DermatologistLayout from "./Components/Dermatologist/DermatologistLayoutPage";
import DermatologistDashboard from "./Components/Dermatologist/DermatologistDashboardPage";
import CaseQueuePage from "./Components/Dermatologist/CaseQueuePage";
import CaseWorkspacePage from "./Components/Dermatologist/CaseWorkspacePage"; // (replaces CaseReview + AIDiagnosis + Treatment)
import DermPatientHistory from "./Components/Dermatologist/DermPatientHistoryPage"; //

import DermProfile from "./Components/Dermatologist/DermProfilePage"; //

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ─────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ── Admin ──────────────────────────────────────────── */}
        <Route path="/admin" element={<PendingUsers />} />
        <Route path="/verify-passcode" element={<VerifyPasscode />} />

        {/* ── Clinician ──────────────────────────────────────── */}
        <Route path="/clinician" element={<ClinicianLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClinicianDashboard />} />
          <Route path="appointments" element={<ClinicianAppointments />} />
          <Route path="patients" element={<ClinicianPatients />} />
          <Route
            path="patients/:patientId"
            element={<ClinicianPatientProfile />}
          />
          <Route path="create-case" element={<CreatePatientCase />} />
          <Route path="cases" element={<ClinicianMyCases />} />
          <Route path="cases/:caseId" element={<ClinicianCaseDetails />} />
          <Route path="billing" element={<BillingNewPage />} />
          <Route path="billing/new" element={<BillingNewPage />} />
        </Route>

        {/* ── Dermatologist ──────────────────────────────────── */}
        <Route path="/dermatologist" element={<DermatologistLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DermatologistDashboard />} />

          {/* Case Queue — list of all cases */}
          <Route path="cases" element={<CaseQueuePage />} />

          {/* Case Workspace — single page, handles Review + Diagnosis + Treatment via ?step= */}
          <Route path="cases/:id" element={<CaseWorkspacePage />} />

          {/* Patient History — search + view full patient record */}
          <Route path="patients" element={<DermPatientHistory />} />
          <Route path="patients/:patientId" element={<DermPatientHistory />} />

          {/* Account pages */}

          <Route path="profile" element={<DermProfile />} />
        </Route>

        {/* ── 404 ────────────────────────────────────────────── */}
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
