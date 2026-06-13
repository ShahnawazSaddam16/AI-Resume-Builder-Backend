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

router.delete("/billings/:id", authMiddleware, limiter, async (req, res) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      });
    }

    await Billing.deleteOne({
      _id: billing._id,
    });

    res.status(200).json({
      success: true,
      message: "Billing record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;