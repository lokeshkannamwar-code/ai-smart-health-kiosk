import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { apiRequest } from "../services/api.js";

function Login() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [role, setRole] = useState("");
  const [loginMethod, setLoginMethod] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (event) => {
    event.preventDefault();
    setError("");
    if (!role) return setError("Please choose your role.");

    const cleanIdentifier = loginMethod === "mobile" ? identifier.trim().replace(/[\s()-]/g, "") : identifier.trim();
    if (!cleanIdentifier) return setError(loginMethod === "mobile" ? "Enter your mobile number" : "Enter your email address");
    if (loginMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier)) {
      return setError("Enter a valid email address.");
    }
    if (loginMethod === "mobile" && !/^\+?[0-9 ()-]{7,20}$/.test(cleanIdentifier)) {
      return setError("Enter a valid mobile number, including the country code if needed.");
    }

    setLoading(true);
    try {
      const data = await apiRequest("auth/request-otp", { method: "POST", auth: false, body: { identifier: cleanIdentifier } });
      navigate("/otp", { state: { role, loginMethod, identifier: cleanIdentifier, language, developmentOtp: data.developmentOtp || "" } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="logo-circle" aria-hidden="true">+</div>
        <p className="eyebrow">{t("Patient and care team portal")}</p>
        <h1>{t("AI Smart Health Kiosk")}</h1>
        <p className="welcome">{t("Welcome to AI Smart Health Kiosk")}</p>
        <h2 id="login-title">{t("Login")}</h2>

        <form onSubmit={handleContinue}>
          <div className="form-section">
            <label>{t("Select your role")}</label>
            <div className="role-buttons">
              {["Patient", "Doctor", "Admin"].map((label) => {
                const value = label.toLowerCase();
                return <button key={value} type="button" aria-pressed={role === value}
                  className={role === value ? "role active" : "role"} onClick={() => setRole(value)}>{t(label)}</button>;
              })}
            </div>
          </div>

          <div className="form-section">
            <label>{t("Choose login method")}</label>
            <div className="method-buttons">
              {["mobile", "email"].map((value) => <button key={value} type="button" aria-pressed={loginMethod === value}
                className={loginMethod === value ? "method active" : "method"}
                onClick={() => { setLoginMethod(value); setIdentifier(""); setError(""); }}>{t(value === "mobile" ? "Mobile" : "Email")}</button>)}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="identifier">{t(loginMethod === "mobile" ? "Mobile" : "Email")}</label>
            <input id="identifier" type={loginMethod === "mobile" ? "tel" : "email"}
              autoComplete={loginMethod === "mobile" ? "tel" : "email"}
              inputMode={loginMethod === "mobile" ? "tel" : "email"}
              value={identifier} onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t(loginMethod === "mobile" ? "Enter your mobile number" : "Enter your email address")} required />
          </div>

          {error && <div className="error-message" role="alert">{t(error)}</div>}
          <button type="submit" className="continue-button" disabled={loading}>
            {loading ? t("Requesting code…") : t("Continue")}
          </button>
        </form>
        <p className="login-footnote">{t("Sign in with an account already registered by your care team.")}</p>
      </section>
    </main>
  );
}

export default Login;
