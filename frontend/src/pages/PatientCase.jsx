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
          <div><p className="eyebrow">PATIENT WORKSPACE</p><h1>Start a health case</h1><p>Share what is happening so the care team can review it.</p></div>
          <button type="button" onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button>
        </header>

        <section className="case-card">
          <div className="case-title"><div className="case-icon" aria-hidden="true">+</div><div>
            <h2>What brings you in today?</h2><p>This guided intake records your answers for your care team. It does not provide a diagnosis.</p>
          </div></div>
          <div className="case-info-box"><strong>If you may be in immediate danger</strong><p>Contact your local emergency service or go to the nearest emergency department.</p></div>
          {error && <div className="case-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group"><label htmlFor="chief_complaint">Main health concern</label>
              <input id="chief_complaint" name="chief_complaint" value={formData.chief_complaint} onChange={handleChange} maxLength={500} placeholder="For example, fever or stomach pain" required />
              <small>Use a few words to describe the main reason for this visit.</small>
            </div>
            <div className="form-group"><label htmlFor="symptoms">What symptoms are you experiencing?</label>
              <textarea id="symptoms" name="symptoms" value={formData.symptoms} onChange={handleChange} rows="5" maxLength={5000} placeholder="Describe what you are feeling and when it happens." required />
            </div>
            <div className="form-group"><label htmlFor="symptom_duration">How long have you had these symptoms?</label>
              <select id="symptom_duration" name="symptom_duration" value={formData.symptom_duration} onChange={handleChange} required>
                <option value="">Select a duration</option><option>Less than 1 day</option><option>1–2 days</option><option>3–7 days</option><option>1–2 weeks</option><option>More than 2 weeks</option><option>More than 1 month</option>
              </select>
            </div>
            <div className="form-group"><label htmlFor="symptom_severity">How severe do the symptoms feel?</label>
              <select id="symptom_severity" name="symptom_severity" value={formData.symptom_severity} onChange={handleChange} required>
                <option value="">Select a severity</option><option>Mild</option><option>Moderate</option><option>Severe</option>
              </select>
            </div>
            <div className="form-group"><label htmlFor="additional_information">Anything else the care team should know? <span>(optional)</span></label>
              <textarea id="additional_information" name="additional_information" value={formData.additional_information} onChange={handleChange} rows="4" maxLength={5000} placeholder="Include relevant details you have not shared above." />
            </div>
            <div className="case-actions">
              <button type="button" className="case-cancel-button" onClick={() => navigate("/patient-dashboard")}>Cancel</button>
              <button type="submit" className="case-submit-button" disabled={saving}>{saving ? "Saving case…" : "Continue to guided questions"}</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default PatientCase;
