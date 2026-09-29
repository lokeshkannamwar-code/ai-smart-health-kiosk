const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const patientAIRoutes = require("./routes/patient-ai.routes");
const patientHealthRoutes = require("./routes/patient-health.routes");
const patientCaseRoutes = require("./routes/patient-case.routes");
const staffRoutes = require("./routes/staff.routes");
const roleTestRoutes = require("./routes/role-test.routes");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.json({ message: "AI Smart Health Kiosk API is running." });
});

app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database() AS database_name");
        res.json({
            success: true,
            server: "running",
            database: "connected",
            databaseName: result.rows[0].database_name,
            project: "AI Smart Health Kiosk",
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);
        res.status(503).json({
            success: false,
            server: "running",
            database: "disconnected",
            message: "The API is running, but the database is unavailable.",
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/patient-ai", patientAIRoutes);
app.use("/api/patient/health", patientHealthRoutes);
app.use("/api/patient/cases", patientCaseRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/test", roleTestRoutes);

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ success: false, message: "Request body must be valid JSON." });
    }
    console.error("Unhandled API error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

const server = app.listen(PORT, () => {
    console.log("AI Smart Health Kiosk API listening on http://localhost:" + PORT);
});

function shutdown() {
    server.close(() => {
        pool.end().finally(() => process.exit(0));
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
