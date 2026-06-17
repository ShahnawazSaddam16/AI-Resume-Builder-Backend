const express = require("express");
const router = express.Router();
const Profile = require("../Models/profile");
const limiter = require("../middleware/limiter");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/profile", limiter, authMiddleware, async (req, res) => {
  try {
    const {
      fullName,
      headline,
      bio,
      skills,
      location,
      website,
      github,
      linkedin,
    } = req.body;

    const existingProfile = await Profile.findOne({
      userId: req.user._id,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }

    const profile = await Profile.create({
      userId: req.user._id,
      email: req.user.email,
      fullName,
      headline,
      bio,
      skills,
      location,
      website,
      github,
      linkedin,
    });

    res.status(201).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/profile", limiter, authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/profile", limiter, authMiddleware, async (req, res) => {
  try {
    const {
      fullName,
      headline,
      bio,
      skills,
      location,
      website,
      github,
      linkedin,
    } = req.body;

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      {
        fullName,
        headline,
        bio,
        skills,
        location,
        website,
        github,
        linkedin,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;