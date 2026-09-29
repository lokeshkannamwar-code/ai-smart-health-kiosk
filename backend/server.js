const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const patientAIRoutes = require("./routes/patient-ai.routes");
const patientHealthRoutes = require("./routes/patient-health.routes");
const patientCaseRoutes = require("./routes/patient-case.routes");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/patient-ai", patientAIRoutes);
app.use("/api/patient/health", patientHealthRoutes);
app.use("/api/patient/cases", patientCaseRoutes);
const roleTestRoutes = require("./routes/role-test.routes");

app.use("/api/test", roleTestRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "AI Smart Health Kiosk Backend is running!"
    });
});
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                current_database() AS database_name,
                current_user AS database_user
        `);

        res.json({
            success: true,
            server: "running",
            database: "connected",
            databaseName: result.rows[0].database_name,
            databaseUser: result.rows[0].database_user,
            project: "AI Smart Health Kiosk"
        });

    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            success: false,
            server: "running",
            database: "disconnected",
            project: "AI Smart Health Kiosk"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});