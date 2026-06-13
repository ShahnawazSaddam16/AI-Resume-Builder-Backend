const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const limiter = require("../middleware/limiter");
const Billing = require("../Models/billing");

router.get("/billings", authMiddleware, limiter, async (req, res) => {
  try {
    const billings = await Billing.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: billings.length,
      billings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;