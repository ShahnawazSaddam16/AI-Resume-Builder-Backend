const express = require("express");
const router = express.Router();
const Resume = require("../Models/ai-resumer");
const { authMiddleware } = require("../middleware/authMiddleware");
const limiter = require("../middleware/limiter");

router.get("/my-resumes", limiter, authMiddleware, async (req, res) => {
  try {
    const MyResumes = await Resume.find({userId: req.user._id,}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      MyResumes,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;