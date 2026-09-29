import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./PatientHealth.css";

const emptyProfile = {
  blood_group: "", date_of_birth: "", gender: "", height_cm: "", weight_kg: "",
  allergies: "", chronic_conditions: "", current_medications: "",
  emergency_contact_name: "", emergency_contact_mobile: "",
};

function PatientHealth() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiRequest("patient/health")
      .then((data) => {
        if (!mounted || !data.healthProfile) return;
        const profile = data.healthProfile;
        setFormData(Object.fromEntries(Object.keys(emptyProfile).map((key) => [key,
          key === "date_of_birth" && profile[key] ? String(profile[key]).slice(0, 10) : profile[key] ?? "",
        ])));
      })
      .catch((requestError) => {
        if (!mounted) return;
        if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
        setError(requestError.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [navigate]);

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      await apiRequest("patient/health", { method: "POST", body: formData });
      setMessage("Your health information has been saved.");
    } catch (requestError) {
      if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
      setError(requestError.message);
    } finally { setSaving(false); }
  };

  if (loading) return <main className="health-page"><section className="health-card" role="status">Loading your health information…</section></main>;

  return <main className="health-page"><div className="health-container">
    <header className="health-header"><div><p className="eyebrow">PATIENT WORKSPACE</p><h1>Health information</h1><p>Keep details that may help your care team up to date.</p></div>
      <button type="button" onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button></header>
    <section className="health-card"><div className="health-title"><div className="health-icon" aria-hidden="true">+</div><div><h2>My health record</h2><p>Only share information you are comfortable adding here.</p></div></div>
      {message && <div className="success-message" role="status">{message}</div>}{error && <div className="error-message" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-section"><h3>Basic information</h3><div className="form-grid">
          <div className="form-group"><label htmlFor="blood_group">Blood group</label><select id="blood_group" name="blood_group" value={formData.blood_group} onChange={handleChange}><option value="">Select blood group</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="form-group"><label htmlFor="date_of_birth">Date of birth</label><input type="date" id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().slice(0,10)} /></div>
          <div className="form-group"><label htmlFor="gender">Gender</label><select id="gender" name="gender" value={formData.gender} onChange={handleChange}><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option><option>Other</option></select></div>
        </div></div>
        <div className="form-section"><h3>Physical information</h3><div className="form-grid">
          <div className="form-group"><label htmlFor="height_cm">Height (cm)</label><input type="number" id="height_cm" name="height_cm" min="30" max="250" step="0.1" value={formData.height_cm} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="weight_kg">Weight (kg)</label><input type="number" id="weight_kg" name="weight_kg" min="1" max="500" step="0.1" value={formData.weight_kg} onChange={handleChange} /></div>
        </div></div>
        <div className="form-section"><h3>Medical information</h3>
          <div className="form-group"><label htmlFor="allergies">Allergies</label><textarea id="allergies" name="allergies" rows="3" value={formData.allergies} onChange={handleChange} placeholder="List known allergies or reactions, or leave blank." /></div>
          <div className="form-group"><label htmlFor="chronic_conditions">Ongoing conditions</label><textarea id="chronic_conditions" name="chronic_conditions" rows="3" value={formData.chronic_conditions} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="current_medications">Current medications</label><textarea id="current_medications" name="current_medications" rows="3" value={formData.current_medications} onChange={handleChange} /></div>
        </div>
        <div className="form-section"><h3>Emergency contact</h3><div className="form-grid">
          <div className="form-group"><label htmlFor="emergency_contact_name">Contact name</label><input id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="emergency_contact_mobile">Contact mobile</label><input type="tel" id="emergency_contact_mobile" name="emergency_contact_mobile" value={formData.emergency_contact_mobile} onChange={handleChange} /></div>
        </div></div>
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate("/patient-dashboard")}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save health information"}</button></div>
      </form>
    </section>
  </div></main>;
}

export default PatientHealth;
