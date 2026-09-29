import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";

const questions = [
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
  const caseId = location.state?.caseId || sessionStorage.getItem("currentCaseId");
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
        if (data.case?.case_status === "COMPLETED") {
          setCompleted(true);
          return;
        }
        const answered = existing.filter((item) => item.sender_type === "PATIENT").length;
        const askedOrders = new Set(existing.filter((item) => item.sender_type === "AI").map((item) => Number(item.question_order)));
        if (answered < questions.length && !askedOrders.has(answered + 1)) {
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
  }, [caseId, navigate]);

  const answers = useMemo(() => messages.filter((item) => item.sender_type === "PATIENT"), [messages]);
  const questionIndex = Math.min(answers.length, questions.length - 1);

  const saveAnswer = async (value) => {
    if (!caseId || saving || completed) return;
    const cleanAnswer = value.trim() || "Prefer not to answer.";
    setSaving(true); setError("");
    try {
      const answerResult = await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages", {
        method: "POST", body: { sender_type: "PATIENT", message_text: cleanAnswer, question_order: questionIndex + 1 },
      });
      const nextMessages = [...messages, answerResult.caseMessage];
      setMessages(nextMessages); setAnswer("");

      if (answers.length + 1 === questions.length) {
        await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/complete", { method: "POST" });
        setCompleted(true);
        return;
      }

      const promptResult = await apiRequest("patient-ai/cases/" + encodeURIComponent(caseId) + "/messages", {
        method: "POST", body: { sender_type: "AI", message_text: questions[answers.length + 1], question_order: answers.length + 2 },
      });
      setMessages((current) => [...current, promptResult.caseMessage]);
    } catch (requestError) {
      if (requestError.status === 401) { localStorage.removeItem("sessionToken"); navigate("/"); return; }
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="interview-page"><section className="interview-card" role="status">Loading your case…</section></main>;

  if (completed) {
    return <main className="interview-page"><section className="interview-card interview-complete">
      <div className="complete-mark" aria-hidden="true">✓</div><p className="eyebrow">CASE RECORDED</p>
      <h1>Thank you for sharing</h1><p>Your answers have been saved for your care team to review. This intake does not provide a diagnosis.</p>
      <div className="interview-actions"><button className="primary-button" onClick={() => navigate("/patient-cases/" + caseId)}>View case</button>
        <button className="secondary-button" onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button></div>
    </section></main>;
  }

  return <main className="interview-page"><section className="interview-card" aria-labelledby="interview-title">
    <header className="interview-header"><button type="button" className="text-button" onClick={() => navigate("/patient-dashboard")}>Back to dashboard</button>
      <p className="eyebrow">GUIDED HEALTH INTAKE</p><h1 id="interview-title">A few more questions</h1>
      <p>These follow-up questions help organize your case for review. They are not medical advice.</p>
    </header>
    <div className="interview-progress" role="progressbar" aria-label="Interview progress" aria-valuemin="0" aria-valuemax={questions.length} aria-valuenow={answers.length}>
      <div style={{ width: ((answers.length / questions.length) * 100) + "%" }} />
    </div>
    <p className="progress-label">Question {questionIndex + 1} of {questions.length}</p>
    <div className="interview-question"><span>CARE TEAM INTAKE</span><h2>{questions[questionIndex]}</h2></div>
    <label className="sr-only" htmlFor="interview-answer">Your answer</label>
    <textarea id="interview-answer" rows="5" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={4000} placeholder="Type your answer here…" />
    {error && <div className="error-message" role="alert">{error}</div>}
    <div className="interview-actions">
      <button type="button" className="secondary-button" onClick={() => saveAnswer("Prefer not to answer.")} disabled={saving}>Skip this question</button>
      <button type="button" className="primary-button" onClick={() => saveAnswer(answer)} disabled={saving || !answer.trim()}>{saving ? "Saving…" : answers.length + 1 === questions.length ? "Finish case" : "Save and continue"}</button>
    </div>
  </section></main>;
}

export default AIQuestions;
