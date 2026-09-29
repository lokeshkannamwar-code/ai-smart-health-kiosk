import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { apiRequest } from "../services/api.js";
import "./AIQuestions.css";

function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const loginData = location.state || {};
  const { role = "", loginMethod = "mobile", identifier = "" } = loginData;
  const [otp, setOtp] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState(loginData.developmentOtp || "");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!identifier) {
    return <main className="otp-page"><section className="otp-card">
      <h1>{t("Sign-in details are missing")}</h1><p>{t("Return to sign in and request a new code.")}</p>
      <button className="back-button" onClick={() => navigate("/")}>{t("Back to sign in")}</button>
    </section></main>;
  }

  const handleOtpChange = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) { setOtp(value); setError(null); }
  };

  const handleVerify = async (event) => {
    event.preventDefault(); setError(null); setMessage("");
    if (otp.length !== 6) return setError({ key: "Enter the 6-digit code." });
    setLoading(true);
    try {
      const data = await apiRequest("auth/verify-otp", { method: "POST", auth: false, body: { identifier: identifier.trim(), otp, role: role.toUpperCase() } });
      const token = data?.session?.token;
      const actualRole = String(data?.user?.role || "").toLowerCase();
      if (!token || !actualRole) throw new Error("The server did not return a complete sign-in session.");
      if (role && role.toLowerCase() !== actualRole) {
        const roleKey = actualRole === "patient" ? "Patient" : actualRole === "doctor" ? "Doctor" : "Admin";
        return setError({ key: "This account is registered as {role}. Go back and choose that role, then request a new code.", values: { role: roleKey } });
      }
      localStorage.setItem("sessionToken", token);
      setMessage("Code verified. Opening your workspace…");
      navigate("/role", { replace: true, state: { role: actualRole, identifier, loginMethod, language, user: data.user, verified: true } });
    } catch (verificationError) {
      setError({ key: verificationError.message });
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setOtp(""); setError(null); setMessage(""); setLoading(true);
    try {
      const data = await apiRequest("auth/request-otp", { method: "POST", auth: false, body: { identifier: identifier.trim() } });
      setDevelopmentOtp(data.developmentOtp || ""); setMessage("A new code was requested.");
    } catch (resendError) { setError({ key: resendError.message }); }
    finally { setLoading(false); }
  };

  const method = t(loginMethod === "mobile" ? "mobile number" : "email address");
  return (
    <main className="otp-page">
      <section className="otp-card" aria-labelledby="otp-title">
        <div className="otp-icon" aria-hidden="true">&#128272;</div>
        <p className="eyebrow">{t("Sign in")}</p>
        <h1 id="otp-title">{t("Verify your account")}</h1>
        <p className="otp-description">{t("Enter the 6-digit code for your {method}.", { method })}</p>
        <div className="otp-identifier"><strong>{identifier}</strong></div>
        {developmentOtp && <div className="demo-otp-box" role="note"><strong>{t("Development code")}</strong><p>{developmentOtp}</p><small>{t("Shown only in development mode. Production delivery must be configured separately.")}</small></div>}
        <form onSubmit={handleVerify}>
          <div className="form-section"><label htmlFor="otp">{t("6-digit code")}</label>
            <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={handleOtpChange} placeholder="000000" maxLength={6} required />
          </div>
          {error && <div className="error-message" role="alert">{t(error.key, error.values ? { role: t(error.values.role) } : {})}</div>}
          {message && <div className="success-message" role="status">{t(message)}</div>}
          <button type="submit" className="continue-button" disabled={loading}>{loading ? t("Verifying…") : t("Verify and continue")}</button>
        </form>
        <button type="button" className="resend-button" onClick={handleResend} disabled={loading}>{t("Request a new code")}</button>
        <button type="button" className="back-button" onClick={() => navigate("/")} disabled={loading}>{t("Back to sign in")}</button>
      </section>
    </main>
  );
}

export default OTPVerification;
