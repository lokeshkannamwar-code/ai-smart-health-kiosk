import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import OTPVerification from "./pages/OTPVerification.jsx";
import RoleSelection from "./pages/RoleSelection.jsx";
import PatientDashboard from "./components/PatientDashboard.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import PatientHealth from "./pages/PatientHealth.jsx";
import PatientCase from "./pages/PatientCase.jsx";
import AIQuestions from "./pages/AIQuestions";
import "./App.css";

function App() {
  return (
    <Routes>

      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* OTP Verification */}
      <Route
        path="/otp"
        element={<OTPVerification />}
      />

      {/* Role / Dashboard */}
      <Route
        path="/role"
        element={<RoleSelection />}
      />
      <Route path="/ai-questions" element={<AIQuestions />} />
      {/* Patient Dashboard */}
<Route 
  path="/patient-dashboard" 
  element={<PatientDashboard />} 
/>
<Route
  path="/patient-profile"
  element={<PatientProfile />}
/>
<Route
  path="/patient-health"
  element={<PatientHealth />}
/>
<Route
  path="/patient-case"
  element={<PatientCase />}
/>

      {/* Unknown page */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default App;