const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "AI Smart Health Kiosk Backend is running!"
    });
});
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "Backend API is connected successfully!",
        project: "AI Smart Health Kiosk"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});