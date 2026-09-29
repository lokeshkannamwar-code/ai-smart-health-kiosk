import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage.js";
import { localeCodes } from "../i18n/i18n.js";
import { apiRequest } from "../services/api.js";
import "./StaffDashboard.css";

function StaffDashboard() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("oldest");
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
      try { await loadData(); }
      catch (requestError) { if (mounted) setError(requestError.message); }
    };
    initialize();
    return () => { mounted = false; };
  }, []);

  const handleReview = async (caseId) => {
    setSavingId(caseId); setError(""); setMessage("");
    try {
      await apiRequest("staff/cases/" + encodeURIComponent(caseId) + "/review", { method: "POST", body: { review_notes: notes[caseId] || "" } });
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

  if (!user && !error) return <main className="staff-page"><p role="status">{t("Loading your workspace…")}</p></main>;
  const isAdmin = String(user?.role).toUpperCase() === "ADMIN";
  const displayName = user?.full_name || user?.fullName || t(isAdmin ? "Administrator" : "Care team");
  const locale = localeCodes[language] || "en-IN";
  const dateTime = (value) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const searchTerm = searchQuery.trim().toLocaleLowerCase(locale);
  const pendingCount = cases.filter((item) => !item.reviewed_at).length;
  const reviewedCount = cases.length - pendingCount;
  const visibleCases = cases
    .filter((item) => {
      if (caseFilter === "pending" && item.reviewed_at) return false;
      if (caseFilter === "reviewed" && !item.reviewed_at) return false;
      if (!searchTerm) return true;
      return [item.patient_name, item.chief_complaint, item.symptoms]
        .some((value) => String(value || "").toLocaleLowerCase(locale).includes(searchTerm));
    })
    .sort((first, second) => {
      const difference = new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
      return sortOrder === "oldest" ? difference : -difference;
    });

  return <div className="staff-page"><header className="staff-header"><div><p className="eyebrow">{t("Care team workspace")}</p><h1>{t(isAdmin ? "System overview" : "Case review queue")}</h1></div>
    <button className="staff-signout" onClick={handleLogout}>{t("Sign out")}</button></header>
    <main className="staff-content"><section className="staff-welcome"><div><h2>{t("Hello, {name}", { name: displayName })}</h2>
      <p>{t(isAdmin ? "A read-only overview of kiosk accounts and case activity." : "Review completed patient intakes and record a care-team note.")}</p></div></section>
    {error && <div className="error-message" role="alert">{t(error)}</div>}{message && <div className="success-message" role="status">{t(message)}</div>}

    {isAdmin && summary && <section className="admin-summary" aria-label={t("System counts")}>{[["Total users", summary.total_users], ["Active users", summary.active_users], ["Patients", summary.patients], ["Doctors", summary.doctors], ["Health cases", summary.total_cases], ["Awaiting review", summary.awaiting_review], ["Reviewed cases", summary.reviewed_cases]].map(([label, value]) => <article key={label}><span>{t(label)}</span><strong>{value}</strong></article>)}</section>}

    {!isAdmin && <section className="staff-queue"><div className="staff-section-heading"><div><p className="eyebrow">{t("Completed patient cases")}</p><h2>{t("Ready for review")}</h2></div><span>{t("Showing {count} of {total} cases", { count: visibleCases.length, total: cases.length })}</span></div>
      {cases.length === 0 ? <div className="staff-empty"><h3>{t("Queue is clear")}</h3><p>{t("Completed patient intakes will appear here.")}</p></div> : <>
        <div className="queue-overview" role="group" aria-label={t("Filter cases")}>
          <button type="button" className={caseFilter === "all" ? "queue-filter-card active" : "queue-filter-card"} aria-pressed={caseFilter === "all"} onClick={() => setCaseFilter("all")}><span>{t("All cases")}</span><strong>{cases.length}</strong></button>
          <button type="button" className={caseFilter === "pending" ? "queue-filter-card active" : "queue-filter-card"} aria-pressed={caseFilter === "pending"} onClick={() => setCaseFilter("pending")}><span>{t("Awaiting review")}</span><strong>{pendingCount}</strong></button>
          <button type="button" className={caseFilter === "reviewed" ? "queue-filter-card active" : "queue-filter-card"} aria-pressed={caseFilter === "reviewed"} onClick={() => setCaseFilter("reviewed")}><span>{t("Reviewed cases")}</span><strong>{reviewedCount}</strong></button>
        </div>
        <div className="queue-tools">
          <label className="queue-search"><span>{t("Search cases")}</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("Search by patient or health concern")} /></label>
          <label><span>{t("Sort by")}</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="oldest">{t("Oldest first")}</option><option value="newest">{t("Newest first")}</option></select></label>
          {(searchQuery || caseFilter !== "all" || sortOrder !== "oldest") && <button type="button" className="queue-clear" onClick={() => { setSearchQuery(""); setCaseFilter("all"); setSortOrder("oldest"); }}>{t("Clear filters")}</button>}
        </div>
        {visibleCases.length === 0 ? <div className="staff-empty queue-no-results"><h3>{t("No cases match your search")}</h3><p>{t("Try another name or health concern, or clear the filters.")}</p></div> : visibleCases.map((item) => <article className="review-card" key={item.id}>
        <div className="review-card-heading"><div><span className="staff-status">{t(item.reviewed_at ? "Reviewed" : item.case_status === "COMPLETED" ? "Completed" : "Draft")}</span><h3>{item.chief_complaint}</h3></div><time>{dateTime(item.created_at)}</time></div>
        <p className="patient-label">{t("Patient: {name}", { name: item.patient_name })}</p>
        <div className="review-facts"><div><span>{t("Symptoms")}</span><p>{item.symptoms}</p></div><div><span>{t("Duration · severity")}</span><p>{item.symptom_duration || t("Not recorded")} · {t(item.symptom_severity || "Not recorded")}</p></div>
          {item.additional_information && <div><span>{t("Additional information")}</span><p>{item.additional_information}</p></div>}</div>
        {item.intake_answers?.length > 0 && <div className="review-facts"><div><span>{t("Guided intake answers")}</span>{item.intake_answers.map((answer, index) => <p key={index}><strong>{t("Answer {number}:", { number: answer.questionOrder })}</strong> {answer.answer}</p>)}</div></div>}
        {item.reviewed_at && <p className="reviewed-at">{t("Reviewed {date}", { date: dateTime(item.reviewed_at) })}</p>}
        <label htmlFor={"review-" + item.id}>{t("Care-team note")} <span>({t("optional, up to 4,000 characters")})</span></label>
        <textarea id={"review-" + item.id} rows="3" maxLength={4000} value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={t("Record a note for the patient’s case history.")} />
        <button className="review-button" disabled={savingId === item.id} onClick={() => handleReview(item.id)}>{savingId === item.id ? t("Saving…") : t(item.reviewed_at ? "Update review" : "Save review")}</button>
      </article>)}</>}</section>}
    <p className="staff-disclaimer">{t("Case review is limited to authorized care-team accounts. The kiosk records patient-provided information and does not create diagnoses or treatment plans.")}</p>
  </main></div>;
}

export default StaffDashboard;
