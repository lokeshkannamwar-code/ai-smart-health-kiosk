const express = require("express");
const crypto = require("crypto");
const pool = require("../config/database");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

const MAX_OTP_ATTEMPTS = 5;
const SESSION_DURATION_HOURS = 24;

function normalizeIdentifier(identifier) {
    return String(identifier || "").trim();
}

function isEmailIdentifier(identifier) {
    return identifier.includes("@");
}

function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashValue(value) {
    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");
}

function generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
}

function getChannel(identifier) {
    return isEmailIdentifier(identifier) ? "EMAIL" : "SMS";
}


/* =========================================================
   REQUEST OTP
   POST /api/auth/request-otp
   ========================================================= */

router.post("/request-otp", async (req, res) => {
    try {
        const identifier = normalizeIdentifier(req.body.identifier);

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Email or mobile number is required."
            });
        }

        const isEmail = isEmailIdentifier(identifier);
        const channel = getChannel(identifier);

        let userResult;

        if (isEmail) {
            userResult = await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    mobile,
                    role,
                    language,
                    is_active
                FROM users
                WHERE LOWER(email) = LOWER($1)
                LIMIT 1
                `,
                [identifier]
            );
        } else {
            userResult = await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    mobile,
                    role,
                    language,
                    is_active
                FROM users
                WHERE mobile = $1
                LIMIT 1
                `,
                [identifier]
            );
        }

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No registered account was found for this email or mobile number."
            });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive."
            });
        }

        const otp = generateOtp();
        const otpHash = hashValue(otp);

        /*
         * Invalidate previously active OTPs for the same user/channel.
         * We mark them verified so they cannot be reused.
         */
        await pool.query(
            `
            UPDATE otp_verifications
            SET verified_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
              AND channel = $2
              AND verified_at IS NULL
            `,
            [user.id, channel]
        );

        await pool.query(
            `
            INSERT INTO otp_verifications
            (
                user_id,
                channel,
                destination,
                otp_hash,
                expires_at,
                attempts
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                CURRENT_TIMESTAMP + INTERVAL '5 minutes',
                0
            )
            `,
            [
                user.id,
                channel,
                identifier,
                otpHash
            ]
        );

        const response = {
            success: true,
            message: "OTP generated successfully.",
            channel,
            destination: identifier,
            expiresInSeconds: 300
        };

        /*
         * Development-only behavior.
         * The OTP will NOT be returned in production.
         */
        if (process.env.NODE_ENV !== "production") {
            response.developmentOtp = otp;
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error("Request OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process OTP request."
        });
    }
});


/* =========================================================
   VERIFY OTP
   POST /api/auth/verify-otp
   ========================================================= */

router.post("/verify-otp", async (req, res) => {
    const client = await pool.connect();

    try {
        const identifier = normalizeIdentifier(req.body.identifier);
        const requestedRole = String(req.body.role || "").trim().toUpperCase();
        const otp = String(req.body.otp || "").trim();

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email/mobile and OTP are required."
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a 6-digit number."
            });
        }

        const channel = getChannel(identifier);

        await client.query("BEGIN");

        /*
         * Find the user.
         */
        let userResult;

        if (channel === "EMAIL") {
            userResult = await client.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    mobile,
                    role,
                    language,
                    is_active
                FROM users
                WHERE LOWER(email) = LOWER($1)
                LIMIT 1
                `,
                [identifier]
            );
        } else {
            userResult = await client.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    mobile,
                    role,
                    language,
                    is_active
                FROM users
                WHERE mobile = $1
                LIMIT 1
                `,
                [identifier]
            );
        }

        if (userResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        const user = userResult.rows[0];

        if (requestedRole && requestedRole !== String(user.role).toUpperCase()) {
            await client.query("ROLLBACK");
            return res.status(403).json({ success: false, message: "This account is registered for the " + String(user.role).toLowerCase() + " role." });
        }

        if (!user.is_active) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                message: "This account is inactive."
            });
        }

        /*
         * Get the latest unverified OTP.
         */
        const otpResult = await client.query(
            `
            SELECT
                id,
                user_id,
                channel,
                destination,
                otp_hash,
                expires_at,
                attempts,
                verified_at
            FROM otp_verifications
            WHERE user_id = $1
              AND channel = $2
              AND destination = $3
              AND verified_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [
                user.id,
                channel,
                identifier
            ]
        );

        if (otpResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "No active OTP was found. Please request a new OTP."
            });
        }

        const otpRecord = otpResult.rows[0];

        /*
         * Check maximum attempts.
         */
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await client.query("ROLLBACK");

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect OTP attempts. Please request a new OTP."
            });
        }

        /*
         * Check expiration.
         */
        if (new Date(otpRecord.expires_at) <= new Date()) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP."
            });
        }

        /*
         * Hash the OTP entered by the user.
         */
        const submittedOtpHash = hashValue(otp);

        if (submittedOtpHash !== otpRecord.otp_hash) {

            await client.query(
                `
                UPDATE otp_verifications
                SET attempts = attempts + 1
                WHERE id = $1
                `,
                [otpRecord.id]
            );

            await client.query("COMMIT");

            return res.status(401).json({
                success: false,
                message: "Invalid OTP."
            });
        }

        /*
         * OTP is correct.
         */
        await client.query(
            `
            UPDATE otp_verifications
            SET
                verified_at = CURRENT_TIMESTAMP,
                attempts = attempts + 1
            WHERE id = $1
            `,
            [otpRecord.id]
        );

        /*
         * Generate a secure random session token.
         */
        const sessionToken = generateSessionToken();

        /*
         * Store only the hash of the session token.
         */
        const sessionTokenHash = hashValue(sessionToken);

        const sessionResult = await client.query(
            `
            INSERT INTO login_sessions
            (
                user_id,
                session_token_hash,
                expires_at
            )
            VALUES
            (
                $1,
                $2,
                CURRENT_TIMESTAMP + INTERVAL '24 hours'
            )
            RETURNING
                id,
                expires_at
            `,
            [
                user.id,
                sessionTokenHash
            ]
        );

        await client.query("COMMIT");

        const session = sessionResult.rows[0];

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                language: user.language
            },
            session: {
                token: sessionToken,
                expiresAt: session.expires_at
            }
        });

    } catch (error) {

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError.message);
        }

        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP."
        });

    } finally {
        client.release();
    }
});
router.get("/me", authenticate, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Authenticated user",
      user: req.user,
      session: req.session
    });
  } catch (error) {
    console.error("GET /me error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// ===============================
// LOGOUT API
// ===============================

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required"
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });
    }

    const sessionToken = authHeader.substring(7).trim();

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token is required"
      });
    }

    const crypto = require("crypto");

    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const result = await pool.query(
      `
      UPDATE login_sessions
      SET revoked_at = NOW()
      WHERE session_token_hash = $1
        AND revoked_at IS NULL
      RETURNING id
      `,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or already logged out session"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during logout"
    });
  }
});
module.exports = router;
