import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import "./PatientCases.css";

function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function PatientCases() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const requestKey = caseId ? "case:" + caseId : "list";
  const [result, setResult] = useState(null);
  const currentResult = result?.requestKey === requestKey ? result : null;
  const cases = currentResult?.cases || [];
  const selectedCase = currentResult?.selectedCase || null;
  const messages = currentResult?.messages || [];
  const error = currentResult?.error || "";
  const loading = !currentResult;

  useEffect(() => {
    let mounted = true;
    const load = caseId
      ? Promise.all([
          apiRequest("patient/cases/" + encodeURIComponent(caseId)),
          apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages"),
        ]).then(([caseData, messageData]) => ({
          cases: [], selectedCase: caseData.case, messages: messageData.messages || [],
        }))
      : apiRequest("patient/cases").then((data) => ({
          cases: data.cases || [], selectedCase: null, messages: [],
        }));

    load.then((data) => {
      if (mounted) setResult({ requestKey, ...data, error: "" });
    }).catch((requestError) => {
      if (!mounted) return;
      if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
      setResult({ requestKey, cases: [], selectedCase: null, messages: [], error: requestError.message });
    });
    return () => { mounted = false; };
  }, [caseId, navigate, requestKey]);

  if (loading) return <main className="history-page"><p role="status">Loading your cases…</p></main>;

  return <main className="history-page"><div className="history-container">
    <header className="history-header"><div><p className="eyebrow">PATIENT WORKSPACE</p><h1>{caseId ? "Case details" : "My health cases"}</h1>
      <p>{caseId ? "Review the information you shared with your care team." : "Your submitted and in-progress health cases."}</p></div>
      <button className="secondary-button" onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button>
    </header>
    {error && <div className="error-message" role="alert">{error}</div>}

    {!caseId && !error && (cases.length === 0 ? <section className="history-empty">
      <h2>No cases yet</h2><p>Start a guided intake when you are ready to share a health concern.</p>
      <button className="primary-button" onClick={() => navigate("/patient-case")}>Start a case</button>
    </section> : <div className="case-list">{cases.map((item) => <button className="case-list-item" key={item.id} onClick={() => navigate("/patient-cases/" + item.id)}>
      <span className="case-list-top"><span className="status-pill">{item.reviewed_at ? "REVIEWED" : item.case_status}</span><time>{formatDate(item.created_at)}</time></span>
      <strong>{item.chief_complaint}</strong><span>{item.symptoms}</span><span className="case-list-meta">{item.symptom_duration || "Duration not recorded"} · {item.symptom_severity || "Severity not recorded"}</span>
    </button>)}</div>)}

    {caseId && selectedCase && <article className="case-detail">
      <div className="case-detail-top"><span className="status-pill">{selectedCase.reviewed_at ? "REVIEWED" : selectedCase.case_status}</span><time>{formatDate(selectedCase.created_at)}</time></div>
      <h2>{selectedCase.chief_complaint}</h2>
      <dl className="case-facts"><div><dt>Duration</dt><dd>{selectedCase.symptom_duration || "Not recorded"}</dd></div><div><dt>Severity</dt><dd>{selectedCase.symptom_severity || "Not recorded"}</dd></div></dl>
      <section><h3>Symptoms</h3><p>{selectedCase.symptoms}</p></section>
      {selectedCase.additional_information && <section><h3>Additional information</h3><p>{selectedCase.additional_information}</p></section>}
      {selectedCase.ai_summary && <section><h3>Case summary</h3><p>{selectedCase.ai_summary}</p></section>}
      {messages.length > 0 && <section className="case-transcript"><h3>Guided intake answers</h3>{messages.filter((item) => item.sender_type === "PATIENT").map((item) => <div key={item.id}><span>Answer {item.question_order || ""}</span><p>{item.message_text}</p></div>)}</section>}
      {selectedCase.review_notes && <section className="review-note"><h3>Care team review note</h3><p>{selectedCase.review_notes}</p></section>}
      <button className="primary-button" onClick={() => navigate("/patient-cases")}>Back to case history</button>
    </article>}
  </div></main>;
}

export default PatientCases;
