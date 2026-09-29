const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "ai_smart_health_kiosk",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on("connect", () => {
    console.log("PostgreSQL connection established");
});

pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error.message);
});

module.exports = pool;
