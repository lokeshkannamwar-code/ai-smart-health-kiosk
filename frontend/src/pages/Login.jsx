import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { languages, languageNames, defaultLanguage } from "../i18n/i18n.js";
import { apiRequest } from "../services/api.js";

function Login() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(defaultLanguage);
  const [role, setRole] = useState("");
  const [loginMethod, setLoginMethod] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const text = languages[language];

  const handleContinue = async (event) => {
    event.preventDefault();
    setError("");
    if (!role) return setError(text.selectRole + ".");

    const cleanIdentifier = loginMethod === "mobile" ? identifier.trim().replace(/[\s()-]/g, "") : identifier.trim();
    if (!cleanIdentifier) return setError(loginMethod === "mobile" ? text.enterMobile : text.enterEmail);
    if (loginMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier)) {
      return setError("Enter a valid email address.");
    }
    if (loginMethod === "mobile" && !/^\+?[0-9 ()-]{7,20}$/.test(cleanIdentifier)) {
      return setError("Enter a valid mobile number, including the country code if needed.");
    }

    setLoading(true);
    try {
      const data = await apiRequest("auth/request-otp", {
        method: "POST",
        auth: false,
        body: { identifier: cleanIdentifier },
      });
      navigate("/otp", {
        state: { role, loginMethod, identifier: cleanIdentifier, language, developmentOtp: data.developmentOtp || "" },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="language-container">
        <label htmlFor="language">Language</label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>
          {Object.entries(languageNames).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </div>

      <section className="login-card" aria-labelledby="login-title">
        <div className="logo-circle" aria-hidden="true">+</div>
        <p className="eyebrow">PATIENT & CARE TEAM PORTAL</p>
        <h1>{text.appName}</h1>
        <p className="welcome">{text.welcome}</p>
        <h2 id="login-title">{text.login}</h2>

        <form onSubmit={handleContinue}>
          <div className="form-section">
            <label>{text.selectRole}</label>
            <div className="role-buttons">
              {[["patient", text.patient], ["doctor", text.doctor], ["admin", text.admin]].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={role === value}
                  className={role === value ? "role active" : "role"} onClick={() => setRole(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label>{text.selectLoginMethod}</label>
            <div className="method-buttons">
              {[["mobile", text.mobile], ["email", text.email]].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={loginMethod === value}
                  className={loginMethod === value ? "method active" : "method"}
                  onClick={() => { setLoginMethod(value); setIdentifier(""); setError(""); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="identifier">{loginMethod === "mobile" ? text.mobile : text.email}</label>
            <input id="identifier" type={loginMethod === "mobile" ? "tel" : "email"}
              autoComplete={loginMethod === "mobile" ? "tel" : "email"}
              inputMode={loginMethod === "mobile" ? "tel" : "email"}
              value={identifier} onChange={(event) => setIdentifier(event.target.value)}
              placeholder={loginMethod === "mobile" ? text.enterMobile : text.enterEmail} required />
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="submit" className="continue-button" disabled={loading}>
            {loading ? "Requesting code…" : text.continue}
          </button>
        </form>
        <p className="login-footnote">Sign in with an account already registered by your care team.</p>
      </section>
    </main>
  );
}

export default Login;
