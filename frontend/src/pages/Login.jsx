import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  languages,
  languageNames,
  defaultLanguage
} from "../i18n/i18n.js";

function Login() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(defaultLanguage);
  const [role, setRole] = useState("");
  const [loginMethod, setLoginMethod] = useState("mobile");
  const [identifier, setIdentifier] = useState("");


  const text = languages[language];

 const handleContinue = async (event) => {
  event.preventDefault();

  if (!role) {
    alert(text.selectRole);
    return;
  }

  if (!identifier.trim()) {
    alert(
      loginMethod === "mobile"
        ? text.enterMobile
        : text.enterEmail
    );
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/request-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          identifier: identifier.trim()
        })
      }
    );

    const data = await response.json();

    console.log("OTP Request Response:", data);

    if (!response.ok) {
      alert(
        data.message ||
        data.error ||
        "Failed to request OTP."
      );
      return;
    }

    navigate("/otp", {
      state: {
        role,
        loginMethod,
        identifier: identifier.trim(),
        language,
        developmentOtp: data.developmentOtp || ""
      }
    });

  } catch (error) {
    console.error("OTP request error:", error);

    alert(
      "Unable to connect to the backend server. Make sure the backend is running on port 5000."
    );
  }
};

  return (
    <div className="login-page">

      {/* LANGUAGE */}
      <div className="language-container">
        <label htmlFor="language">
          Language
        </label>

        <select
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {Object.entries(languageNames).map(
            ([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            )
          )}
        </select>
      </div>

      {/* LOGIN CARD */}
      <div className="login-card">

        <div className="logo-circle">
          🏥
        </div>

        <h1>{text.appName}</h1>

        <p className="welcome">
          {text.welcome}
        </p>

        <h2>{text.login}</h2>

        {/* ROLE */}
        <div className="form-section">

          <label>
            {text.selectRole}
          </label>

          <div className="role-buttons">

            <button
              type="button"
              className={
                role === "patient"
                  ? "role active"
                  : "role"
              }
              onClick={() => setRole("patient")}
            >
              👤 {text.patient}
            </button>

            <button
              type="button"
              className={
                role === "doctor"
                  ? "role active"
                  : "role"
              }
              onClick={() => setRole("doctor")}
            >
              👨‍⚕️ {text.doctor}
            </button>

            <button
              type="button"
              className={
                role === "admin"
                  ? "role active"
                  : "role"
              }
              onClick={() => setRole("admin")}
            >
              🛡️ {text.admin}
            </button>

          </div>

        </div>

        {/* MOBILE / EMAIL */}
        <div className="form-section">

          <label>
            {text.selectLoginMethod}
          </label>

          <div className="method-buttons">

            <button
              type="button"
              className={
                loginMethod === "mobile"
                  ? "method active"
                  : "method"
              }
              onClick={() => setLoginMethod("mobile")}
            >
              📱 {text.mobile}
            </button>

            <button
              type="button"
              className={
                loginMethod === "email"
                  ? "method active"
                  : "method"
              }
              onClick={() => setLoginMethod("email")}
            >
              ✉️ {text.email}
            </button>

          </div>

        </div>

        {/* INPUT */}
        <form onSubmit={handleContinue}>

          <div className="form-section">

            <label htmlFor="identifier">

              {loginMethod === "mobile"
                ? text.mobile
                : text.email}

            </label>

            <input
              id="identifier"
              type={
                loginMethod === "mobile"
                  ? "tel"
                  : "email"
              }
              value={identifier}
              onChange={(event) =>
                setIdentifier(event.target.value)
              }
              placeholder={
                loginMethod === "mobile"
                  ? text.enterMobile
                  : text.enterEmail
              }
            />

          </div>

          <button
            type="submit"
            className="continue-button"
          >
            {text.continue}
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;