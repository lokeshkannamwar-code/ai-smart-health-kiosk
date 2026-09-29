const express = require("express");
const pool = require("../config/database");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();
const patientOnly = [authenticate, requireRole("PATIENT")];

router.post("/", ...patientOnly, async (req, res) => {
    const chiefComplaint = String(req.body.chief_complaint || "").trim();
    const symptoms = String(req.body.symptoms || "").trim();
    const duration = String(req.body.symptom_duration || "").trim();
    const severity = String(req.body.symptom_severity || "").trim();
    const additional = String(req.body.additional_information || "").trim();

    if (!chiefComplaint || !symptoms || !duration || !severity) {
        return res.status(400).json({ success: false, message: "Main concern, symptoms, duration, and severity are required." });
    }
    if (chiefComplaint.length > 500 || symptoms.length > 5000 || additional.length > 5000) {
        return res.status(400).json({ success: false, message: "Please shorten the information and try again." });
    }
    if (!["Mild", "Moderate", "Severe"].includes(severity)) {
        return res.status(400).json({ success: false, message: "Choose a valid symptom severity." });
    }

    try {
        const result = await pool.query([
            "INSERT INTO patient_cases (patient_id, chief_complaint, symptoms, symptom_duration, symptom_severity, additional_information, case_status)",
            "VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), 'DRAFT')",
            "RETURNING id, patient_id, chief_complaint, symptoms, symptom_duration, symptom_severity, additional_information, case_status, created_at, updated_at",
        ].join(" "), [req.user.id, chiefComplaint, symptoms, duration, severity, additional]);
        return res.status(201).json({ success: true, message: "Patient case created.", case: result.rows[0] });
    } catch (error) {
        console.error("Create patient case error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to create patient case." });
    }
});

router.get("/", ...patientOnly, async (req, res) => {
    try {
        const result = await pool.query([
            "SELECT id, patient_id, chief_complaint, symptoms, symptom_duration, symptom_severity,",
            "additional_information, case_status, ai_summary, reviewed_at, review_notes, created_at, updated_at",
            "FROM patient_cases WHERE patient_id = $1 ORDER BY created_at DESC",
        ].join(" "), [req.user.id]);
        return res.json({ success: true, cases: result.rows });
    } catch (error) {
        console.error("Get patient cases error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to retrieve patient cases." });
    }
});

router.get("/:id", ...patientOnly, async (req, res) => {
    const caseId = Number(req.params.id);
    if (!Number.isSafeInteger(caseId) || caseId < 1) {
        return res.status(400).json({ success: false, message: "Invalid case ID." });
    }
    try {
        const result = await pool.query([
            "SELECT id, patient_id, chief_complaint, symptoms, symptom_duration, symptom_severity,",
            "additional_information, case_status, ai_summary, reviewed_at, review_notes, created_at, updated_at",
            "FROM patient_cases WHERE id = $1 AND patient_id = $2 LIMIT 1",
        ].join(" "), [caseId, req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Case not found." });
        return res.json({ success: true, case: result.rows[0] });
    } catch (error) {
        console.error("Get patient case error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to retrieve patient case." });
    }
});

module.exports = router;
