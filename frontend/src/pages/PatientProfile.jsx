import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { apiRequest } from "../services/api.js";
import "./PatientProfile.css";

function PatientProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  if (loading) return <main className="profile-page"><section className="profile-card" role="status">{t("Loading your profile…")}</section></main>;
  if (error) return <main className="profile-page"><section className="profile-card"><h1>{t("Unable to load profile")}</h1><p role="alert">{t(error)}</p><button onClick={() => navigate("/patient-dashboard")}>{t("Back to dashboard")}</button></section></main>;

  const fullName = user?.full_name || user?.fullName || t("Patient");
  const role = String(user?.role || "PATIENT").toLowerCase();
  return <main className="profile-page"><div className="profile-container">
    <header className="profile-header"><div><p className="eyebrow">{t("Patient workspace")}</p><h1>{t("My profile")}</h1><p>{t("Account information associated with your sign-in.")}</p></div><button type="button" onClick={() => navigate("/patient-dashboard")}>{t("Back to dashboard")}</button></header>
    <section className="profile-card"><div className="profile-avatar" aria-hidden="true">{fullName.slice(0,1).toUpperCase()}</div><h2>{fullName}</h2><p className="profile-role">{t(role === "doctor" ? "Doctor" : role === "admin" ? "Admin" : "Patient")}</p>
      <div className="profile-information">
        <div className="profile-row"><span>{t("Full name")}</span><strong>{fullName}</strong></div>
        <div className="profile-row"><span>{t("Mobile number")}</span><strong>{user?.mobile || t("Not provided")}</strong></div>
        <div className="profile-row"><span>{t("Email address")}</span><strong>{user?.email || t("Not provided")}</strong></div>
        <div className="profile-row"><span>{t("Account status")}</span><strong className="active-status">{t("Active")}</strong></div>
      </div>
    </section>
  </div></main>;
}

export default PatientProfile;
