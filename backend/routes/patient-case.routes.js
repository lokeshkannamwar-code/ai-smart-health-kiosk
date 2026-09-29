const express = require("express");
const pool = require("../config/database");

const {
    authenticate,
    requireRole
} = require("../middleware/auth.middleware");

const router = express.Router();


// =====================================================
// CREATE NEW PATIENT CASE
// =====================================================

router.post(
    "/",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const patientId = req.user.id;

            const {
                chief_complaint,
                symptoms,
                symptom_duration,
                symptom_severity,
                additional_information
            } = req.body;


            if (!chief_complaint || !chief_complaint.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Chief complaint is required."
                });

            }


            if (!symptoms || !symptoms.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Symptoms are required."
                });

            }


            const result = await pool.query(
                `
                INSERT INTO patient_cases (
                    patient_id,
                    chief_complaint,
                    symptoms,
                    symptom_duration,
                    symptom_severity,
                    additional_information,
                    case_status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    'DRAFT'
                )
                RETURNING *
                `,
                [
                    patientId,
                    chief_complaint.trim(),
                    symptoms.trim(),
                    symptom_duration || null,
                    symptom_severity || null,
                    additional_information || null
                ]
            );


            res.status(201).json({

                success: true,

                message: "Patient case created successfully.",

                case: result.rows[0]

            });


        } catch (error) {

            console.error(
                "Create patient case error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to create patient case."

            });

        }

    }
);


// =====================================================
// GET ALL CASES FOR LOGGED-IN PATIENT
// =====================================================

router.get(
    "/",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const patientId = req.user.id;


            const result = await pool.query(
                `
                SELECT
                    id,
                    patient_id,
                    chief_complaint,
                    symptoms,
                    symptom_duration,
                    symptom_severity,
                    additional_information,
                    case_status,
                    ai_summary,
                    created_at,
                    updated_at
                FROM patient_cases
                WHERE patient_id = $1
                ORDER BY created_at DESC
                `,
                [patientId]
            );


            res.json({

                success: true,

                cases: result.rows

            });


        } catch (error) {

            console.error(
                "Get patient cases error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve patient cases."

            });

        }

    }
);


// =====================================================
// GET SINGLE CASE
// =====================================================

router.get(
    "/:id",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const patientId = req.user.id;

            const caseId = Number(req.params.id);


            if (!Number.isInteger(caseId)) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid case ID."

                });

            }


            const result = await pool.query(
                `
                SELECT
                    id,
                    patient_id,
                    chief_complaint,
                    symptoms,
                    symptom_duration,
                    symptom_severity,
                    additional_information,
                    case_status,
                    ai_summary,
                    created_at,
                    updated_at
                FROM patient_cases
                WHERE id = $1
                AND patient_id = $2
                `,
                [
                    caseId,
                    patientId
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({

                    success: false,

                    message: "Case not found."

                });

            }


            res.json({

                success: true,

                case: result.rows[0]

            });


        } catch (error) {

            console.error(
                "Get patient case error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve patient case."

            });

        }

    }
);


module.exports = router;