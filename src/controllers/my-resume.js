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

router.delete("/my-resumes/:id", limiter, authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    await Resume.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
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