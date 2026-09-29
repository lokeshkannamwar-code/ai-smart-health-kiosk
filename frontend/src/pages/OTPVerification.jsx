import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./AIQuestions.css";

function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginData = location.state || {};
  const { role = "", loginMethod = "mobile", identifier = "" } = loginData;
  const [otp, setOtp] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState(loginData.developmentOtp || "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!identifier) {
    return (
      <main className="otp-page"><section className="otp-card">
        <h1>Sign-in details are missing</h1><p>Return to sign in and request a new code.</p>
        <button className="back-button" onClick={() => navigate("/")}>Back to sign in</button>
      </section></main>
    );
  }

  const handleOtpChange = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) { setOtp(value); setError(""); }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    try {
      const data = await apiRequest("auth/verify-otp", {
        method: "POST", auth: false, body: { identifier: identifier.trim(), otp, role: role.toUpperCase() },
      });
      const token = data?.session?.token;
      const actualRole = String(data?.user?.role || "").toLowerCase();
      if (!token || !actualRole) throw new Error("The server did not return a complete sign-in session.");
      if (role && role.toLowerCase() !== actualRole) {
        return setError("This account is registered as " + actualRole + ". Go back and choose that role, then request a new code.");
      }
      localStorage.setItem("sessionToken", token);
      setMessage("Code verified. Opening your workspace…");
      navigate("/role", { replace: true, state: { role: actualRole, identifier, loginMethod, language, user: data.user, verified: true } });
    } catch (verificationError) {
      setError(verificationError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(""); setError(""); setMessage(""); setLoading(true);
    try {
      const data = await apiRequest("auth/request-otp", { method: "POST", auth: false, body: { identifier: identifier.trim() } });
      setDevelopmentOtp(data.developmentOtp || "");
      setMessage("A new code was requested.");
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="otp-page">
      <section className="otp-card" aria-labelledby="otp-title">
        <div className="otp-icon" aria-hidden="true">&#128272;</div>
        <p className="eyebrow">SECURE SIGN IN</p>
        <h1 id="otp-title">Verify your account</h1>
        <p className="otp-description">Enter the 6-digit code for your {loginMethod === "mobile" ? "mobile number" : "email address"}.</p>
        <div className="otp-identifier"><strong>{identifier}</strong></div>

        {developmentOtp && <div className="demo-otp-box" role="note">
          <strong>Development code</strong><p>{developmentOtp}</p>
          <small>Shown only in development mode. Production delivery must be configured separately.</small>
        </div>}

        <form onSubmit={handleVerify}>
          <div className="form-section">
            <label htmlFor="otp">6-digit code</label>
            <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
              value={otp} onChange={handleOtpChange} placeholder="000000" maxLength={6} required />
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          {message && <div className="success-message" role="status">{message}</div>}
          <button type="submit" className="continue-button" disabled={loading}>{loading ? "Verifying…" : "Verify and continue"}</button>
        </form>

        <button type="button" className="resend-button" onClick={handleResend} disabled={loading}>Request a new code</button>
        <button type="button" className="back-button" onClick={() => navigate("/")} disabled={loading}>Back to sign in</button>
      </section>
    </main>
  );
}

export default OTPVerification;
