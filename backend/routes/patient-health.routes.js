const express = require("express");
const pool = require("../config/database");

const {
    authenticate,
    requireRole
} = require("../middleware/auth.middleware");

const router = express.Router();

/*
    GET PATIENT HEALTH PROFILE
    GET /api/patient/health
*/
router.get(
    "/",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const userId = req.user.id;

            const result = await pool.query(
                `
                SELECT
                    id,
                    user_id,
                    blood_group,
                    date_of_birth,
                    gender,
                    height_cm,
                    weight_kg,
                    allergies,
                    chronic_conditions,
                    current_medications,
                    emergency_contact_name,
                    emergency_contact_mobile,
                    created_at,
                    updated_at
                FROM patient_health_profiles
                WHERE user_id = $1
                `,
                [userId]
            );

            if (result.rows.length === 0) {

                return res.json({
                    success: true,
                    exists: false,
                    healthProfile: null
                });

            }

            res.json({
                success: true,
                exists: true,
                healthProfile: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Get patient health profile error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: "Failed to retrieve health information."
            });

        }

    }
);


/*
    CREATE / UPDATE PATIENT HEALTH PROFILE
    POST /api/patient/health
*/
router.post(
    "/",
    authenticate,
    requireRole("PATIENT"),
    async (req, res) => {

        try {

            const userId = req.user.id;

            const {
                blood_group,
                date_of_birth,
                gender,
                height_cm,
                weight_kg,
                allergies,
                chronic_conditions,
                current_medications,
                emergency_contact_name,
                emergency_contact_mobile
            } = req.body;


            const result = await pool.query(
                `
                INSERT INTO patient_health_profiles (
                    user_id,
                    blood_group,
                    date_of_birth,
                    gender,
                    height_cm,
                    weight_kg,
                    allergies,
                    chronic_conditions,
                    current_medications,
                    emergency_contact_name,
                    emergency_contact_mobile
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    $11
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    blood_group = EXCLUDED.blood_group,
                    date_of_birth = EXCLUDED.date_of_birth,
                    gender = EXCLUDED.gender,
                    height_cm = EXCLUDED.height_cm,
                    weight_kg = EXCLUDED.weight_kg,
                    allergies = EXCLUDED.allergies,
                    chronic_conditions = EXCLUDED.chronic_conditions,
                    current_medications = EXCLUDED.current_medications,
                    emergency_contact_name = EXCLUDED.emergency_contact_name,
                    emergency_contact_mobile = EXCLUDED.emergency_contact_mobile,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
                `,
                [
                    userId,
                    blood_group || null,
                    date_of_birth || null,
                    gender || null,
                    height_cm || null,
                    weight_kg || null,
                    allergies || null,
                    chronic_conditions || null,
                    current_medications || null,
                    emergency_contact_name || null,
                    emergency_contact_mobile || null
                ]
            );


            res.status(200).json({
                success: true,
                message: "Health information saved successfully.",
                healthProfile: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Save patient health profile error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: "Failed to save health information."
            });

        }

    }
);


module.exports = router;