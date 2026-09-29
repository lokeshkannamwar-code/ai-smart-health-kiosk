import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { localeCodes } from "../i18n/i18n.js";
import { apiRequest } from "../services/api.js";
import "./PatientCases.css";

function PatientCases() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const { language, t } = useLanguage();
  const requestKey = caseId ? "case:" + caseId : "list";
  const [result, setResult] = useState(null);
  const currentResult = result?.requestKey === requestKey ? result : null;
  const cases = currentResult?.cases || [];
  const selectedCase = currentResult?.selectedCase || null;
  const messages = currentResult?.messages || [];
  const error = currentResult?.error || "";
  const loading = !currentResult;
  const locale = localeCodes[language] || "en-IN";
  const formatDate = (value) => {
    if (!value) return t("Date unavailable");
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  };

  useEffect(() => {
    let mounted = true;
    const load = caseId
      ? Promise.all([
          apiRequest("patient/cases/" + encodeURIComponent(caseId)),
          apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages"),
        ]).then(([caseData, messageData]) => ({ cases: [], selectedCase: caseData.case, messages: messageData.messages || [] }))
      : apiRequest("patient/cases").then((data) => ({ cases: data.cases || [], selectedCase: null, messages: [] }));

    load.then((data) => { if (mounted) setResult({ requestKey, ...data, error: "" }); })
      .catch((requestError) => {
        if (!mounted) return;
        if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
        setResult({ requestKey, cases: [], selectedCase: null, messages: [], error: requestError.message });
      });
    return () => { mounted = false; };
  }, [caseId, navigate, requestKey]);

  const status = (item) => t(item.reviewed_at ? "Reviewed" : item.case_status === "COMPLETED" ? "Completed" : "Draft");
  if (loading) return <main className="history-page"><p role="status">{t("Loading your cases…")}</p></main>;

  return <main className="history-page"><div className="history-container">
    <header className="history-header"><div><p className="eyebrow">{t("Patient workspace")}</p><h1>{t(caseId ? "Case details" : "My health cases")}</h1>
      <p>{t(caseId ? "Review the information you shared with your care team." : "Your submitted and in-progress health cases.")}</p></div>
      <button className="secondary-button" onClick={() => navigate("/patient-dashboard")}>{t("Back to dashboard")}</button>
    </header>
    {error && <div className="error-message" role="alert">{t(error)}</div>}

    {!caseId && !error && (cases.length === 0 ? <section className="history-empty">
      <h2>{t("No cases yet")}</h2><p>{t("Start a guided intake when you are ready to share a health concern.")}</p>
      <button className="primary-button" onClick={() => navigate("/patient-case")}>{t("Start a case")}</button>
    </section> : <div className="case-list">{cases.map((item) => <button className="case-list-item" key={item.id} onClick={() => navigate("/patient-cases/" + item.id)}>
      <span className="case-list-top"><span className="status-pill">{status(item)}</span><time>{formatDate(item.created_at)}</time></span>
      <strong>{item.chief_complaint}</strong><span>{item.symptoms}</span><span className="case-list-meta">{item.symptom_duration || t("Duration not recorded")} · {t(item.symptom_severity || "Severity not recorded")}</span>
    </button>)}</div>)}

    {caseId && selectedCase && <article className="case-detail">
      <div className="case-detail-top"><span className="status-pill">{status(selectedCase)}</span><time>{formatDate(selectedCase.created_at)}</time></div>
      <h2>{selectedCase.chief_complaint}</h2>
      <dl className="case-facts"><div><dt>{t("Duration")}</dt><dd>{selectedCase.symptom_duration || t("Not recorded")}</dd></div><div><dt>{t("Severity")}</dt><dd>{t(selectedCase.symptom_severity || "Not recorded")}</dd></div></dl>
      <section><h3>{t("Symptoms")}</h3><p>{selectedCase.symptoms}</p></section>
      {selectedCase.additional_information && <section><h3>{t("Additional information")}</h3><p>{selectedCase.additional_information}</p></section>}
      {selectedCase.ai_summary && <section><h3>{t("Case summary")}</h3><p>{selectedCase.ai_summary}</p></section>}
      {messages.filter((item) => item.sender_type === "PATIENT").length > 0 && <section className="case-transcript"><h3>{t("Guided intake answers")}</h3>{messages.filter((item) => item.sender_type === "PATIENT").map((item) => <div key={item.id}><span>{t("Answer {number}", { number: item.question_order || "" })}</span><p>{item.message_text}</p></div>)}</section>}
      {selectedCase.review_notes && <section className="review-note"><h3>{t("Care team review note")}</h3><p>{selectedCase.review_notes}</p></section>}
      <button className="primary-button" onClick={() => navigate("/patient-cases")}>{t("Back to case history")}</button>
    </article>}
  </div></main>;
}

export default PatientCases;
