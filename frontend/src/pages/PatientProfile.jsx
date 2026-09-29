import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./PatientProfile.css";

function PatientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiRequest("auth/me")
      .then((data) => { if (mounted) setUser(data.user); })
      .catch((requestError) => {
        if (!mounted) return;
        if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
        setError(requestError.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [navigate]);

  if (loading) return <main className="profile-page"><section className="profile-card" role="status">Loading your profile…</section></main>;
  if (error) return <main className="profile-page"><section className="profile-card"><h1>Unable to load profile</h1><p role="alert">{error}</p><button onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button></section></main>;

  const fullName = user?.full_name || user?.fullName || "Patient";
  return <main className="profile-page"><div className="profile-container">
    <header className="profile-header"><div><p className="eyebrow">PATIENT WORKSPACE</p><h1>My profile</h1><p>Account information associated with your sign-in.</p></div><button type="button" onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button></header>
    <section className="profile-card"><div className="profile-avatar" aria-hidden="true">{fullName.slice(0,1).toUpperCase()}</div><h2>{fullName}</h2><p className="profile-role">{String(user?.role || "PATIENT").toLowerCase()}</p>
      <div className="profile-information">
        <div className="profile-row"><span>Full name</span><strong>{fullName}</strong></div>
        <div className="profile-row"><span>Mobile number</span><strong>{user?.mobile || "Not provided"}</strong></div>
        <div className="profile-row"><span>Email address</span><strong>{user?.email || "Not provided"}</strong></div>
        <div className="profile-row"><span>Account status</span><strong className="active-status">Active</strong></div>
      </div>
    </section>
  </div></main>;
}

export default PatientProfile;
