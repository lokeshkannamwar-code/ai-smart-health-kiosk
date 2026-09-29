import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./StaffDashboard.css";

function StaffDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    const userData = await apiRequest("auth/me");
    if (String(userData.user.role).toUpperCase() === "ADMIN") {
      const data = await apiRequest("staff/summary");
      setSummary(data.summary);
    } else {
      const data = await apiRequest("staff/cases");
      setCases(data.cases || []);
      setNotes(Object.fromEntries((data.cases || []).map((item) => [item.id, item.review_notes || ""])));
    }
    setUser(userData.user);
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        await loadData();
      } catch (requestError) {
        if (mounted) setError(requestError.message);
      }
    };
    initialize();
    return () => { mounted = false; };
  }, []);

  const handleReview = async (caseId) => {
    setSavingId(caseId); setError(""); setMessage("");
    try {
      await apiRequest("staff/cases/" + encodeURIComponent(caseId) + "/review", {
        method: "POST", body: { review_notes: notes[caseId] || "" },
      });
      await loadData();
      setMessage("Review saved.");
    } catch (requestError) {
      if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
      setError(requestError.message);
    } finally { setSavingId(null); }
  };

  const handleLogout = async () => {
    try { await apiRequest("auth/logout", { method: "POST" }); } catch { /* Clear the local session if the server is unavailable. */ }
    localStorage.removeItem("sessionToken"); navigate("/", { replace: true });
  };

  if (!user && !error) return <main className="staff-page"><p role="status">Loading your workspace…</p></main>;
  const isAdmin = String(user?.role).toUpperCase() === "ADMIN";

  return <div className="staff-page"><header className="staff-header"><div><p className="eyebrow">Care team workspace</p><h1>{isAdmin ? "System overview" : "Case review queue"}</h1></div>
    <button className="staff-signout" onClick={handleLogout}>Sign out</button></header>
    <main className="staff-content"><section className="staff-welcome"><div><h2>Hello, {user?.full_name || user?.fullName || (isAdmin ? "Administrator" : "Care team")}</h2>
      <p>{isAdmin ? "A read-only overview of kiosk accounts and case activity." : "Review completed patient intakes and record a care-team note."}</p></div></section>
    {error && <div className="error-message" role="alert">{error}</div>}{message && <div className="success-message" role="status">{message}</div>}

    {isAdmin && summary && <section className="admin-summary" aria-label="System counts">{[["Total users", summary.total_users], ["Active users", summary.active_users], ["Patients", summary.patients], ["Doctors", summary.doctors], ["Health cases", summary.total_cases], ["Awaiting review", summary.awaiting_review], ["Reviewed", summary.reviewed_cases]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>}

    {!isAdmin && <section className="staff-queue"><div className="staff-section-heading"><div><p className="eyebrow">Completed patient cases</p><h2>Ready for review</h2></div><span>{cases.length} {cases.length === 1 ? "case" : "cases"}</span></div>
      {cases.length === 0 ? <div className="staff-empty"><h3>Queue is clear</h3><p>Completed patient intakes will appear here.</p></div> : cases.map((item) => <article className="review-card" key={item.id}>
        <div className="review-card-heading"><div><span className="staff-status">{item.case_status}</span><h3>{item.chief_complaint}</h3></div><time>{new Date(item.created_at).toLocaleString()}</time></div>
        <p className="patient-label">Patient: {item.patient_name}</p>
        <div className="review-facts"><div><span>Symptoms</span><p>{item.symptoms}</p></div><div><span>Duration · severity</span><p>{item.symptom_duration || "Not recorded"} · {item.symptom_severity || "Not recorded"}</p></div>
          {item.additional_information && <div><span>Additional information</span><p>{item.additional_information}</p></div>}</div>
        {item.intake_answers?.length > 0 && <div className="review-facts"><div><span>Guided intake answers</span>{item.intake_answers.map((answer, index) => <p key={index}><strong>Answer {answer.questionOrder}:</strong> {answer.answer}</p>)}</div></div>}
        {item.reviewed_at && <p className="reviewed-at">Reviewed {new Date(item.reviewed_at).toLocaleString()}</p>}
        <label htmlFor={"review-" + item.id}>Care-team note <span>(optional, up to 4,000 characters)</span></label>
        <textarea id={"review-" + item.id} rows="3" maxLength={4000} value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Record a note for the patient’s case history." />
        <button className="review-button" disabled={savingId === item.id} onClick={() => handleReview(item.id)}>{savingId === item.id ? "Saving…" : item.reviewed_at ? "Update review" : "Save review"}</button>
      </article>)}</section>}
    <p className="staff-disclaimer">Case review is limited to authorized care-team accounts. The kiosk records patient-provided information and does not create diagnoses or treatment plans.</p>
  </main></div>;
}

export default StaffDashboard;
