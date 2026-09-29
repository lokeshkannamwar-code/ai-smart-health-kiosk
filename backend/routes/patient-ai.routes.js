const express = require("express");

const pool = require("../config/database");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

/*
=========================================================
GET CASE MESSAGES
GET /api/patient-ai/cases/:caseId/messages
=========================================================
*/

router.get(
    "/cases/:caseId/messages",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const caseId = Number(req.params.caseId);
            const userId = req.user.id;

            if (!Number.isInteger(caseId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid case ID."
                });

            }

            /*
             * Make sure this case belongs to
             * the currently logged-in patient.
             */

            const caseResult = await pool.query(
                `
                SELECT
                    id,
                    patient_id,
                    case_status
                FROM patient_cases
                WHERE id = $1
                  AND patient_id = $2
                LIMIT 1
                `,
                [caseId, userId]
            );

            if (caseResult.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Case not found."
                });

            }

            const messagesResult = await pool.query(
                `
                SELECT
                    id,
                    case_id,
                    sender_type,
                    message_text,
                    question_order,
                    created_at
                FROM case_messages
                WHERE case_id = $1
                ORDER BY id ASC
                `,
                [caseId]
            );

            return res.status(200).json({
                success: true,
                case: caseResult.rows[0],
                messages: messagesResult.rows
            });

        } catch (error) {

            console.error(
                "Get case messages error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load case messages."
            });

        }

    }
);


/*
=========================================================
ADD MESSAGE
POST /api/patient-ai/cases/:caseId/messages
=========================================================
*/

router.post(
    "/cases/:caseId/messages",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const caseId = Number(req.params.caseId);
            const userId = req.user.id;

            const {
                sender_type,
                message_text,
                question_order
            } = req.body;


            /*
             * Validate case ID
             */

            if (!Number.isInteger(caseId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid case ID."
                });

            }


            /*
             * Validate sender
             */

            if (
                sender_type !== "AI" &&
                sender_type !== "PATIENT"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "sender_type must be AI or PATIENT."
                });

            }


            /*
             * Validate message
             */

            if (
                !message_text ||
                !String(message_text).trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Message text is required."
                });

            }


            /*
             * Check case ownership
             */

            const caseResult = await pool.query(
                `
                SELECT
                    id,
                    patient_id,
                    case_status
                FROM patient_cases
                WHERE id = $1
                  AND patient_id = $2
                LIMIT 1
                `,
                [caseId, userId]
            );

            if (caseResult.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Case not found."
                });

            }


            /*
             * Insert message
             */

            const result = await pool.query(
                `
                INSERT INTO case_messages
                (
                    case_id,
                    sender_type,
                    message_text,
                    question_order
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )
                RETURNING
                    id,
                    case_id,
                    sender_type,
                    message_text,
                    question_order,
                    created_at
                `,
                [
                    caseId,
                    sender_type,
                    String(message_text).trim(),
                    question_order || null
                ]
            );


            return res.status(201).json({
                success: true,
                message: "Case message saved successfully.",
                caseMessage: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Save case message error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to save case message."
            });

        }

    }
);


/*
=========================================================
COMPLETE CASE
POST /api/patient-ai/cases/:caseId/complete
=========================================================
*/

router.post(
    "/cases/:caseId/complete",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const caseId = Number(req.params.caseId);
            const userId = req.user.id;

            if (!Number.isInteger(caseId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid case ID."
                });

            }


            const result = await pool.query(
                `
                UPDATE patient_cases
                SET
                    case_status = 'COMPLETED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                  AND patient_id = $2
                RETURNING
                    id,
                    patient_id,
                    case_status,
                    updated_at
                `,
                [caseId, userId]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Case not found."
                });

            }


            return res.status(200).json({
                success: true,
                message: "Case completed successfully.",
                case: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Complete case error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to complete case."
            });

        }

    }
);


module.exports = router;