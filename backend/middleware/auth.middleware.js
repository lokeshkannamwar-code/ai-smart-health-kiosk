const crypto = require("crypto");
const pool = require("../config/database");

function hashValue(value) {
    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");
}

async function authenticate(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const parts = authorization.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }

        const sessionToken = parts[1];

        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message: "Session token is missing."
            });
        }

        const sessionTokenHash = hashValue(sessionToken);

        const result = await pool.query(
            `
            SELECT
                ls.id AS session_id,
                ls.user_id,
                ls.expires_at,
                ls.revoked_at,

                u.full_name,
                u.email,
                u.mobile,
                u.role,
                u.language,
                u.is_active

            FROM login_sessions ls

            JOIN users u
                ON ls.user_id = u.id

            WHERE ls.session_token_hash = $1
            LIMIT 1
            `,
            [sessionTokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid session."
            });
        }

        const session = result.rows[0];

        if (session.revoked_at !== null) {
            return res.status(401).json({
                success: false,
                message: "Session has been revoked."
            });
        }

        if (new Date(session.expires_at) <= new Date()) {
            return res.status(401).json({
                success: false,
                message: "Session has expired."
            });
        }

        if (!session.is_active) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive."
            });
        }

        await pool.query(
            `
            UPDATE login_sessions
            SET last_activity_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [session.session_id]
        );

        req.user = {
            id: session.user_id,
            fullName: session.full_name,
            email: session.email,
            mobile: session.mobile,
            role: session.role,
            language: session.language
        };

        req.session = {
            id: session.session_id,
            expiresAt: session.expires_at
        };

        next();

    } catch (error) {
        console.error("Authentication middleware error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication check failed."
        });
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    requireRole
};