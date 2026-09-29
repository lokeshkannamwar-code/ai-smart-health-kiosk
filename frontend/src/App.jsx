import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import OTPVerification from "./pages/OTPVerification.jsx";
import RoleSelection from "./pages/RoleSelection.jsx";
import PatientDashboard from "./components/PatientDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import StaffDashboard from "./components/StaffDashboard.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import PatientHealth from "./pages/PatientHealth.jsx";
import PatientCase from "./pages/PatientCase.jsx";
import PatientCases from "./pages/PatientCases.jsx";
import AIQuestions from "./pages/AIQuestions.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import { useLanguage } from "./i18n/useLanguage.js";
import "./App.css";

function App() {
  const { t } = useLanguage();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <span className="app-brand-mark" aria-hidden="true">+</span>
            <span className="app-brand-copy"><strong>{t("AI Smart Health Kiosk")}</strong><small>{t("Presented by")} <b>LAXMIPOOJA TECH COMPANY</b></small></span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<OTPVerification />} />
        <Route path="/role" element={<RoleSelection />} />

        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-profile" element={<PatientProfile />} />
          <Route path="/patient-health" element={<PatientHealth />} />
          <Route path="/patient-case" element={<PatientCase />} />
          <Route path="/patient-cases" element={<PatientCases />} />
          <Route path="/patient-cases/:caseId" element={<PatientCases />} />
          <Route path="/ai-questions" element={<AIQuestions />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["DOCTOR", "ADMIN"]} />}>
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
