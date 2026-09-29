import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { localeCodes } from "../i18n/i18n.js";
import { apiRequest } from "../services/api.js";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([apiRequest("auth/me"), apiRequest("patient/cases")])
      .then(([userData, caseData]) => { if (mounted) { setUser(userData.user); setCases(caseData.cases || []); } })
      .catch((requestError) => {
        if (!mounted) return;
        if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
        setError(requestError.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [navigate, t]);

  const handleLogout = async () => {
    try { await apiRequest("auth/logout", { method: "POST" }); } catch { /* Clear the local session if the API is unavailable. */ }
    localStorage.removeItem("sessionToken");
    sessionStorage.removeItem("currentCaseId");
    navigate("/", { replace: true });
  };

  if (loading) return <main className="patient-dashboard"><div className="dashboard-content"><section className="welcome-section" role="status">{t("Loading your patient workspace…")}</section></div></main>;
  const name = user?.full_name || user?.fullName || t("Patient");
  const locale = localeCodes[language] || "en-IN";

  return <div className="patient-dashboard">
    <header className="dashboard-header"><div><p className="eyebrow">{t("Patient workspace")}</p><h1>{t("Health kiosk")}</h1></div>
      <div className="dashboard-header-actions"><button type="button" onClick={() => navigate("/patient-profile")}>{t("My profile")}</button><button type="button" className="logout-button" onClick={handleLogout}>{t("Sign out")}</button></div>
    </header>
    <main className="dashboard-content">
      <section className="welcome-section"><div><p className="eyebrow">{t("Your health, in one place")}</p><h2>{t("Welcome, {name}", { name })}</h2>
        <p>{t("Keep your health information together and share a clear case with your care team.")}</p></div>
        <div className="dashboard-stats"><div><strong>{cases.length}</strong><span>{t("Health cases")}</span></div><div><strong>{cases.filter((item) => item.case_status === "COMPLETED" && !item.reviewed_at).length}</strong><span>{t("Awaiting review")}</span></div></div>
      </section>
      {error && <div className="error-message" role="alert">{t(error)}</div>}
      <section className="dashboard-grid" aria-label={t("Patient tools")}>
        <article className="dashboard-card dashboard-card-primary"><span className="dashboard-card-icon" aria-hidden="true">01</span><p className="eyebrow">{t("Guided intake")}</p><h3>{t("Start a health case")}</h3><p>{t("Describe a health concern and answer a few follow-up questions for your care team.")}</p><button type="button" onClick={() => navigate("/patient-case")}>{t("Start a case")}</button></article>
        <article className="dashboard-card"><span className="dashboard-card-icon" aria-hidden="true">02</span><p className="eyebrow">{t("Your record")}</p><h3>{t("Health information")}</h3><p>{t("Manage allergies, medications, conditions, and emergency contact details.")}</p><button type="button" onClick={() => navigate("/patient-health")}>{t("Open health record")}</button></article>
        <article className="dashboard-card"><span className="dashboard-card-icon" aria-hidden="true">03</span><p className="eyebrow">{t("Case history")}</p><h3>{t("Previous cases")}</h3><p>{t("Review the concerns and answers you have already shared.")}</p><button type="button" onClick={() => navigate("/patient-cases")}>{t("View case history")}</button></article>
      </section>
      <section className="recent-cases"><div className="section-heading"><div><p className="eyebrow">{t("Recent cases")}</p><h2>{t("Your latest cases")}</h2></div>
        {cases.length > 0 && <button type="button" className="text-button" onClick={() => navigate("/patient-cases")}>{t("View all")}</button>}</div>
        {cases.length === 0 ? <p className="empty-cases">{t("Your submitted cases will appear here.")}</p> : cases.slice(0, 3).map((item) => <button type="button" className="recent-case-row" key={item.id} onClick={() => navigate("/patient-cases/" + item.id)}>
          <span><strong>{item.chief_complaint}</strong><small>{new Intl.DateTimeFormat(locale).format(new Date(item.created_at))}</small></span><span className="dashboard-status">{t(item.reviewed_at ? "Reviewed" : item.case_status === "COMPLETED" ? "Completed" : "Draft")}</span>
        </button>)}
      </section>
    </main>
  </div>;
}

export default PatientDashboard;
