const express = require("express");

const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// ==========================================
// PATIENT TEST API
// ==========================================

router.get(
  "/patient",
  authenticate,
  requireRole("PATIENT"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Patient role authorization successful",
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  }
);

// ==========================================
// DOCTOR TEST API
// ==========================================

router.get(
  "/doctor",
  authenticate,
  requireRole("DOCTOR"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Doctor role authorization successful",
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  }
);

// ==========================================
// ADMIN TEST API
// ==========================================

router.get(
  "/admin",
  authenticate,
  requireRole("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Admin role authorization successful",
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  }
);

module.exports = router;