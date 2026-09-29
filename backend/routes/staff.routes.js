const express = require("express");
const pool = require("../config/database");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/cases", authenticate, requireRole("DOCTOR", "ADMIN"), async (req, res) => {
    try {
        const result = await pool.query([
            "SELECT c.id, c.patient_id, u.full_name AS patient_name,",
            "c.chief_complaint, c.symptoms, c.symptom_duration,",
            "c.symptom_severity, c.additional_information, c.case_status,",
            "c.review_notes, c.reviewed_at, c.created_at, c.updated_at",
            ", COALESCE((SELECT json_agg(json_build_object('questionOrder', m.question_order, 'answer', m.message_text) ORDER BY m.id)",
            "FROM case_messages m WHERE m.case_id = c.id AND m.sender_type = 'PATIENT'), '[]'::json) AS intake_answers",
            "FROM patient_cases c JOIN users u ON u.id = c.patient_id",
            "WHERE c.case_status = 'COMPLETED'",
            "ORDER BY CASE WHEN c.reviewed_at IS NULL THEN 0 ELSE 1 END, c.created_at ASC",
        ].join(" "));
        return res.json({ success: true, cases: result.rows });
    } catch (error) {
        console.error("Load staff case queue error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load the case review queue." });
    }
});

router.post("/cases/:id/review", authenticate, requireRole("DOCTOR"), async (req, res) => {
    const caseId = Number(req.params.id);
    const reviewNotes = String(req.body.review_notes || "").trim();

    if (!Number.isSafeInteger(caseId) || caseId < 1) {
        return res.status(400).json({ success: false, message: "Invalid case ID." });
    }
    if (reviewNotes.length > 4000) {
        return res.status(400).json({ success: false, message: "Review notes must be 4,000 characters or fewer." });
    }

    try {
        const result = await pool.query([
            "UPDATE patient_cases SET reviewer_id = $2,",
            "review_notes = NULLIF($3, ''), reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP",
            "WHERE id = $1 AND case_status = 'COMPLETED'",
            "RETURNING id, case_status, review_notes, reviewed_at",
        ].join(" "), [caseId, req.user.id, reviewNotes]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Completed case not found." });
        }
        return res.json({ success: true, case: result.rows[0] });
    } catch (error) {
        console.error("Review patient case error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save the case review." });
    }
});

router.get("/summary", authenticate, requireRole("ADMIN"), async (req, res) => {
    try {
        const result = await pool.query([
            "SELECT (SELECT COUNT(*)::INTEGER FROM users) AS total_users,",
            "(SELECT COUNT(*)::INTEGER FROM users WHERE is_active = TRUE) AS active_users,",
            "(SELECT COUNT(*)::INTEGER FROM users WHERE role = 'PATIENT') AS patients,",
            "(SELECT COUNT(*)::INTEGER FROM users WHERE role = 'DOCTOR') AS doctors,",
            "(SELECT COUNT(*)::INTEGER FROM patient_cases) AS total_cases,",
            "(SELECT COUNT(*)::INTEGER FROM patient_cases WHERE case_status = 'COMPLETED' AND reviewed_at IS NULL) AS awaiting_review,",
            "(SELECT COUNT(*)::INTEGER FROM patient_cases WHERE reviewed_at IS NOT NULL) AS reviewed_cases",
        ].join(" "));
        return res.json({ success: true, summary: result.rows[0] });
    } catch (error) {
        console.error("Load administrator summary error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load the system overview." });
    }
});

module.exports = router;
