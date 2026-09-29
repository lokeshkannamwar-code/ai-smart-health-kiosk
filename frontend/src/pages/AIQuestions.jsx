import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { apiRequest } from "../services/api.js";
import "./AIQuestions.css";

const questionKeys = [
  "When did these symptoms start, and have they changed since then?",
  "What seems to make the symptoms better or worse?",
  "Have you noticed any other symptoms?",
  "Have you taken any medicine for this concern? You may skip this question.",
  "Do you have any allergies or reactions to medicine? You may skip this question.",
  "Is there anything else you would like the care team to know? You may skip this question.",
];

function AIQuestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const caseId = location.state?.caseId || sessionStorage.getItem("currentCaseId");
  const questions = useMemo(() => questionKeys.map((key) => t(key)), [t]);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!caseId) { navigate("/patient-case", { replace: true }); return () => { mounted = false; }; }
    apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages")
      .then(async (data) => {
        if (!mounted) return;
        const existing = Array.isArray(data.messages) ? data.messages : [];
        setMessages(existing);
        if (data.case?.case_status === "COMPLETED") { setCompleted(true); return; }
        const answered = existing.filter((item) => item.sender_type === "PATIENT").length;
        const askedOrders = new Set(existing.filter((item) => item.sender_type === "AI").map((item) => Number(item.question_order)));
        if (answered < questionKeys.length && !askedOrders.has(answered + 1)) {
          const prompt = await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages", {
            method: "POST", body: { sender_type: "AI", message_text: questions[answered], question_order: answered + 1 },
          });
          if (mounted) setMessages((current) => [...current, prompt.caseMessage]);
        }
      })
      .catch((requestError) => {
        if (!mounted) return;
        if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
        setError(requestError.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [caseId, navigate, questions]);

  const answers = useMemo(() => messages.filter((item) => item.sender_type === "PATIENT"), [messages]);
  const questionIndex = Math.min(answers.length, questions.length - 1);

  const saveAnswer = async (value) => {
    if (!caseId || saving || completed) return;
    const cleanAnswer = value.trim() || t("Prefer not to answer.");
    setSaving(true); setError("");
    try {
      const answerResult = await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages", {
        method: "POST", body: { sender_type: "PATIENT", message_text: cleanAnswer, question_order: questionIndex + 1 },
      });
      const nextMessages = [...messages, answerResult.caseMessage];
      setMessages(nextMessages); setAnswer("");
      if (answers.length + 1 === questionKeys.length) {
        await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/complete", { method: "POST" });
        setCompleted(true); return;
      }
      const nextOrder = answers.length + 2;
      const promptResult = await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages", {
        method: "POST", body: { sender_type: "AI", message_text: questions[nextOrder - 1], question_order: nextOrder },
      });
      setMessages((current) => [...current, promptResult.caseMessage]);
    } catch (requestError) {
      if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
      setError(requestError.message);
    } finally { setSaving(false); }
  };

  if (loading) return <main className="interview-page"><section className="interview-card" role="status">{t("Loading your case…")}</section></main>;
  if (completed) return <main className="interview-page"><section className="interview-card interview-complete">
    <div className="complete-mark" aria-hidden="true">✓</div><p className="eyebrow">{t("Case recorded")}</p>
    <h1>{t("Thank you for sharing")}</h1><p>{t("Your answers have been saved for your care team to review. This intake does not provide a diagnosis.")}</p>
    <div className="interview-actions"><button className="primary-button" onClick={() => navigate("/patient-cases/" + caseId)}>{t("View case")}</button>
      <button className="secondary-button" onClick={() => navigate("/patient-dashboard")}>{t("Back to dashboard")}</button></div>
  </section></main>;

  return <main className="interview-page"><section className="interview-card" aria-labelledby="interview-title">
    <header className="interview-header"><button type="button" className="text-button" onClick={() => navigate("/patient-dashboard")}>{t("Back to dashboard")}</button>
      <p className="eyebrow">{t("Health questions")}</p><h1 id="interview-title">{t("A few more questions")}</h1>
      <p>{t("These follow-up questions help organize your case for review. They are not medical advice.")}</p>
    </header>
    <div className="interview-progress" role="progressbar" aria-label={t("Interview progress")} aria-valuemin="0" aria-valuemax={questionKeys.length} aria-valuenow={answers.length}>
      <div style={{ width: ((answers.length / questionKeys.length) * 100) + "%" }} />
    </div>
    <p className="progress-label">{t("Question {current} of {total}", { current: questionIndex + 1, total: questionKeys.length })}</p>
    <div className="interview-question"><span>{t("About your visit")}</span><h2>{questions[questionIndex]}</h2></div>
    <label className="sr-only" htmlFor="interview-answer">{t("Your answer")}</label>
    <textarea id="interview-answer" rows="5" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={4000} placeholder={t("Type your answer here…")} />
    {error && <div className="error-message" role="alert">{t(error)}</div>}
    <div className="interview-actions">
      <button type="button" className="secondary-button" onClick={() => saveAnswer("")} disabled={saving}>{t("Skip this question")}</button>
      <button type="button" className="primary-button" onClick={() => saveAnswer(answer)} disabled={saving || !answer.trim()}>{saving ? t("Saving…") : answers.length + 1 === questionKeys.length ? t("Finish case") : t("Save and continue")}</button>
    </div>
  </section></main>;
}

export default AIQuestions;
