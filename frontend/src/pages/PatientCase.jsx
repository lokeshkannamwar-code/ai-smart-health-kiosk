import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./PatientCase.css";

function PatientCase() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    chief_complaint: "", symptoms: "", symptom_duration: "", symptom_severity: "", additional_information: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!formData.chief_complaint.trim()) return setError("Please enter your main health concern.");
    if (!formData.symptoms.trim()) return setError("Please describe your symptoms.");
    if (!formData.symptom_duration) return setError("Please select how long you have had the symptoms.");
    if (!formData.symptom_severity) return setError("Please select the severity of your symptoms.");
    setSaving(true);
    try {
      const data = await apiRequest("patient/cases", { method: "POST", body: formData });
      if (!data.case?.id) throw new Error("The case was saved, but its ID was not returned.");
      sessionStorage.setItem("currentCaseId", String(data.case.id));
      navigate("/ai-questions", { state: { caseId: data.case.id } });
    } catch (requestError) {
      if (requestError.status === 401) {
        localStorage.removeItem("sessionToken");
        navigate("/");
        return;
      }
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="case-page">
      <div className="case-container">
        <header className="case-header">
          <div className="case-brand">
            <span className="case-brand-mark" aria-hidden="true">+</span>
            <span><strong>Health Kiosk</strong><small>Patient visit form</small></span>
          </div>
          <button type="button" className="case-back-button" onClick={() => navigate("/patient-dashboard")}>
            <span aria-hidden="true">←</span> Dashboard
          </button>
        </header>

        <div className="case-layout">
          <aside className="case-intro">
            <p className="case-step-label">Step 1 of 2 · Case details</p>
            <h1>Tell us what’s going on.</h1>
            <p>Start with the main concern. A few follow-up questions come next.</p>

            <ol className="case-progress" aria-label="Intake steps">
              <li className="case-progress-current"><span>1</span> About your visit</li>
              <li><span>2</span> Follow-up questions</li>
            </ol>

            <div className="case-info-box">
              <strong>Need urgent help?</strong>
              <p>If you may be in immediate danger, contact your local emergency service or go to the nearest emergency department.</p>
            </div>
          </aside>

          <section className="case-card" aria-labelledby="case-form-title">
            <div className="case-card-heading">
              <div><h2 id="case-form-title">About this visit</h2><p>Share only what you are comfortable adding.</p></div>
              <span>Part 1 / 2</span>
            </div>
            <p className="case-explanation">Your answers will be saved with this case for the care team to review. This form does not provide a diagnosis.</p>
            {error && <div className="case-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="chief_complaint">Main health concern <span>*</span></label>
                <input id="chief_complaint" name="chief_complaint" value={formData.chief_complaint} onChange={handleChange} maxLength={500} placeholder="For example, fever or stomach pain" required />
                <small>A few words is enough.</small>
              </div>
              <div className="form-group">
                <label htmlFor="symptoms">What symptoms are you experiencing? <span>*</span></label>
                <textarea id="symptoms" name="symptoms" value={formData.symptoms} onChange={handleChange} rows="4" maxLength={5000} placeholder="What are you feeling? When did it start?" required />
              </div>
              <div className="case-field-row">
                <div className="form-group">
                  <label htmlFor="symptom_duration">How long have you had these symptoms? <span>*</span></label>
                  <select id="symptom_duration" name="symptom_duration" value={formData.symptom_duration} onChange={handleChange} required>
                    <option value="">Choose one</option><option>Less than 1 day</option><option>1–2 days</option><option>3–7 days</option><option>1–2 weeks</option><option>More than 2 weeks</option><option>More than 1 month</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="symptom_severity">How severe do they feel? <span>*</span></label>
                  <select id="symptom_severity" name="symptom_severity" value={formData.symptom_severity} onChange={handleChange} required>
                    <option value="">Choose one</option><option>Mild</option><option>Moderate</option><option>Severe</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="additional_information">Anything else to add? <small>(optional)</small></label>
                <textarea id="additional_information" name="additional_information" value={formData.additional_information} onChange={handleChange} rows="3" maxLength={5000} placeholder="Add any detail that may help explain your concern." />
              </div>
              <div className="case-actions">
                <button type="button" className="case-cancel-button" onClick={() => navigate("/patient-dashboard")}>Cancel</button>
                <button type="submit" className="case-submit-button" disabled={saving}>{saving ? "Saving…" : "Continue to questions  →"}</button>
              </div>
            </form>
          </section>
        </div>
        <footer className="case-footer">Health Kiosk · Patient intake</footer>
      </div>
    </main>
  );
}

export default PatientCase;
