import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { apiRequest } from "../services/api.js";

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const [status, setStatus] = useState(() => localStorage.getItem("sessionToken") ? "checking" : "signed-out");
  const [role, setRole] = useState("");

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("sessionToken");
    if (!token) return () => { mounted = false; };

    apiRequest("auth/me")
      .then((data) => {
        if (!mounted) return;
        const actualRole = String(data.user?.role || "").toUpperCase();
        if (!actualRole) throw new Error("Your account role could not be verified.");
        setRole(actualRole);
        setStatus("ready");
      })
      .catch((error) => {
        if (!mounted) return;
        if (error.status === 401 || error.status === 403) localStorage.removeItem("sessionToken");
        setStatus(error.status === 0 ? "offline" : "signed-out");
      });

    return () => { mounted = false; };
  }, []);

  if (status === "checking") {
    return <main className="route-status" role="status">Checking your secure session…</main>;
  }
  if (status === "offline") {
    return (
      <main className="route-status">
        <h1>Can’t reach the health kiosk</h1>
        <p>The API could not be reached. Start the backend, then try this page again.</p>
        <a href="/">Return to sign in</a>
      </main>
    );
  }
  if (status !== "ready") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === "PATIENT" ? "/patient-dashboard" : "/staff-dashboard"} replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
