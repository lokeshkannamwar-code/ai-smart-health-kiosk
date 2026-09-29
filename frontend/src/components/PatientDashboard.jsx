import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([apiRequest("auth/me"), apiRequest("patient/cases")])
      .then(([userData, caseData]) => {
        if (mounted) { setUser(userData.user); setCases(caseData.cases || []); }
      })
      .catch((requestError) => {
        if (!mounted) return;
        if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
        setError(requestError.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [navigate]);

  const handleLogout = async () => {
    try { await apiRequest("auth/logout", { method: "POST" }); } catch { /* The local session is cleared even if the API is offline. */ }
    localStorage.removeItem("sessionToken");
    sessionStorage.removeItem("currentCaseId");
    navigate("/", { replace: true });
  };

  if (loading) return <main className="patient-dashboard"><div className="dashboard-content"><section className="welcome-section" role="status">Loading your patient workspace…</section></div></main>;

  return <div className="patient-dashboard">
    <header className="dashboard-header"><div><p className="eyebrow">PATIENT WORKSPACE</p><h1>Health kiosk</h1></div>
      <div className="dashboard-header-actions"><button type="button" onClick={() => navigate("/patient-profile")}>My profile</button><button type="button" className="logout-button" onClick={handleLogout}>Sign out</button></div>
    </header>
    <main className="dashboard-content">
      <section className="welcome-section"><div><p className="eyebrow">YOUR HEALTH, ORGANIZED</p><h2>Welcome, {user?.full_name || user?.fullName || "Patient"}</h2>
        <p>Keep your health information together and share a clear case with your care team.</p></div>
        <div className="dashboard-stats"><div><strong>{cases.length}</strong><span>Health cases</span></div><div><strong>{cases.filter((item) => item.case_status === "COMPLETED" && !item.reviewed_at).length}</strong><span>Awaiting review</span></div></div>
      </section>
      {error && <div className="error-message" role="alert">{error}</div>}
      <section className="dashboard-grid" aria-label="Patient tools">
        <article className="dashboard-card dashboard-card-primary"><span className="dashboard-card-icon" aria-hidden="true">01</span><p className="eyebrow">GUIDED INTAKE</p><h3>Start a health case</h3><p>Describe a health concern and answer a few follow-up questions for your care team.</p><button type="button" onClick={() => navigate("/patient-case")}>Start a case</button></article>
        <article className="dashboard-card"><span className="dashboard-card-icon" aria-hidden="true">02</span><p className="eyebrow">YOUR RECORD</p><h3>Health information</h3><p>Manage allergies, medications, conditions, and emergency contact details.</p><button type="button" onClick={() => navigate("/patient-health")}>Open health record</button></article>
        <article className="dashboard-card"><span className="dashboard-card-icon" aria-hidden="true">03</span><p className="eyebrow">CASE HISTORY</p><h3>Previous cases</h3><p>Review the concerns and answers you have already shared.</p><button type="button" onClick={() => navigate("/patient-cases")}>View case history</button></article>
      </section>

      <section className="recent-cases"><div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Your latest cases</h2></div>
        {cases.length > 0 && <button type="button" className="text-button" onClick={() => navigate("/patient-cases")}>View all</button>}</div>
        {cases.length === 0 ? <p className="empty-cases">Your submitted cases will appear here.</p> : cases.slice(0, 3).map((item) => <button type="button" className="recent-case-row" key={item.id} onClick={() => navigate("/patient-cases/" + item.id)}>
          <span><strong>{item.chief_complaint}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></span><span className="dashboard-status">{item.reviewed_at ? "REVIEWED" : item.case_status}</span>
        </button>)}
      </section>
    </main>
  </div>;
}

export default PatientDashboard;
