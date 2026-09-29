const express = require("express");
const pool = require("../config/database");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();
const patientOnly = [authenticate, requireRole("PATIENT")];
const QUESTION_COUNT = 6;

async function findOwnedCase(caseId, userId) {
    return pool.query(
        "SELECT id, patient_id, case_status, reviewed_at FROM patient_cases WHERE id = $1 AND patient_id = $2 LIMIT 1",
        [caseId, userId]
    );
}

router.get("/cases/:caseId/messages", ...patientOnly, async (req, res) => {
    const caseId = Number(req.params.caseId);
    if (!Number.isSafeInteger(caseId) || caseId < 1) {
        return res.status(400).json({ success: false, message: "Invalid case ID." });
    }
    try {
        const caseResult = await findOwnedCase(caseId, req.user.id);
        if (caseResult.rows.length === 0) return res.status(404).json({ success: false, message: "Case not found." });
        const result = await pool.query(
            "SELECT id, case_id, sender_type, message_text, question_order, created_at FROM case_messages WHERE case_id = $1 ORDER BY id ASC",
            [caseId]
        );
        return res.json({ success: true, case: caseResult.rows[0], messages: result.rows });
    } catch (error) {
        console.error("Get case messages error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load case messages." });
    }
});

router.post("/cases/:caseId/messages", ...patientOnly, async (req, res) => {
    const caseId = Number(req.params.caseId);
    const senderType = String(req.body.sender_type || "").toUpperCase();
    const messageText = String(req.body.message_text || "").trim();
    const questionOrder = Number(req.body.question_order);
    if (!Number.isSafeInteger(caseId) || caseId < 1) {
        return res.status(400).json({ success: false, message: "Invalid case ID." });
    }
    if (!["AI", "PATIENT"].includes(senderType)) {
        return res.status(400).json({ success: false, message: "Message sender is invalid." });
    }
    if (!messageText || messageText.length > 4000) {
        return res.status(400).json({ success: false, message: "Enter a message of 1 to 4,000 characters." });
    }
    if (!Number.isSafeInteger(questionOrder) || questionOrder < 1 || questionOrder > QUESTION_COUNT) {
        return res.status(400).json({ success: false, message: "Question number is invalid." });
    }
    try {
        const caseResult = await findOwnedCase(caseId, req.user.id);
        if (caseResult.rows.length === 0) return res.status(404).json({ success: false, message: "Case not found." });
        if (caseResult.rows[0].case_status !== "DRAFT") {
            return res.status(409).json({ success: false, message: "This case has already been submitted." });
        }
        const result = await pool.query([
            "INSERT INTO case_messages (case_id, sender_type, message_text, question_order)",
            "VALUES ($1, $2, $3, $4)",
            "RETURNING id, case_id, sender_type, message_text, question_order, created_at",
        ].join(" "), [caseId, senderType, messageText, questionOrder]);
        return res.status(201).json({ success: true, caseMessage: result.rows[0] });
    } catch (error) {
        console.error("Save case message error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save your answer." });
    }
});

router.post("/cases/:caseId/complete", ...patientOnly, async (req, res) => {
    const caseId = Number(req.params.caseId);
    if (!Number.isSafeInteger(caseId) || caseId < 1) {
        return res.status(400).json({ success: false, message: "Invalid case ID." });
    }
    try {
        const caseResult = await findOwnedCase(caseId, req.user.id);
        if (caseResult.rows.length === 0) return res.status(404).json({ success: false, message: "Case not found." });
        if (caseResult.rows[0].case_status === "COMPLETED") {
            return res.json({ success: true, message: "Case already submitted.", case: caseResult.rows[0] });
        }
        const answerResult = await pool.query(
            "SELECT COUNT(DISTINCT question_order)::INTEGER AS answer_count FROM case_messages WHERE case_id = $1 AND sender_type = 'PATIENT'",
            [caseId]
        );
        if (answerResult.rows[0].answer_count < QUESTION_COUNT) {
            return res.status(400).json({ success: false, message: "Please finish the guided questions before submitting the case." });
        }
        const result = await pool.query([
            "UPDATE patient_cases SET case_status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP",
            "WHERE id = $1 AND patient_id = $2 AND case_status = 'DRAFT'",
            "RETURNING id, patient_id, case_status, updated_at",
        ].join(" "), [caseId, req.user.id]);
        if (result.rows.length === 0) return res.status(409).json({ success: false, message: "The case could not be submitted in its current state." });
        return res.json({ success: true, message: "Case submitted for care-team review.", case: result.rows[0] });
    } catch (error) {
        console.error("Complete patient case error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to submit the case." });
    }
});

module.exports = router;
