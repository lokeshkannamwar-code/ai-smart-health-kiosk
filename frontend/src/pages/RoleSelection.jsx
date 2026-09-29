import { Navigate, useLocation } from "react-router-dom";

function RoleSelection() {
  const location = useLocation();
  const data = location.state || {};
  if (!data.verified || !data.user?.role) return <Navigate to="/" replace />;
  const role = String(data.user.role).toUpperCase();
  if (role === "PATIENT") return <Navigate to="/patient-dashboard" replace />;
  if (role === "DOCTOR" || role === "ADMIN") return <Navigate to="/staff-dashboard" replace />;
  return <Navigate to="/" replace />;
}

export default RoleSelection;
