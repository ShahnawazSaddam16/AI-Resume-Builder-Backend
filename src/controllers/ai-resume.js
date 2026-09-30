require("dotenv").config();
const express = require("express");
const router = express.Router();
const limiter = require("../middleware/limiter");
const multer = require("multer");
const Groq = require("groq-sdk");
const Resume = require("../Models/ai-resumer");
const { authMiddleware } = require("../middleware/authMiddleware");
const extractPdfText = require("../utils/extractPdfText");
const generateResumePdf = require("../utils/generateResumePdf");
const Plan = require("../Models/plan");
const calculateAtsScore = require("../utils/calculateAtsScore");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post(
  "/ai-resume",
  limiter,
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      const { prompt, template } = req.body;

      let resumeText = "";

      const userPlan = await Plan.findOne({
        userId: req.user._id,
      });

      let limit = 1;

      if (userPlan) {
        if (userPlan.planId === "pro" || userPlan.planId === "elite") {
          limit = Infinity;
        }
      }

      const userResumeCount = await Resume.countDocuments({
        userId: req.user._id,
      });

      if (limit !== Infinity && userResumeCount >= limit) {
        return res.status(403).json({
          success: false,
          message: "Plan limit reached. Upgrade your plan.",
        });
      }

      const themes = ["blue", "green", "black", "purple", "orange", "teal"];

      let allowedThemes = ["blue", "orange"];

      let isPremium = false;

      if (
        userPlan &&
        (userPlan.planId === "pro" || userPlan.planId === "elite")
      ) {
        allowedThemes = themes;
        isPremium = true;
      }

      let finalTemplate = template || "blue";

      if (!allowedThemes.includes(finalTemplate)) {
        if (!isPremium) {
          return res.status(403).json({
            success: false,
            message:
              "This theme is not available in free plan. Upgrade to Pro or Elite to use all themes.",
          });
        }
        finalTemplate = "blue";
      }

      if (req.file) {
        resumeText = await extractPdfText(req.file.buffer);
      }

      const hasPdf = !!req.file;

      const charCount = prompt ? prompt.trim().length : 0;

      if (!hasPdf && charCount < 10) {
        return res.status(400).json({
          success: false,
          message:
            "Provide either a PDF resume or a prompt containing at least 10 characters.",
        });
      }

      const safePrompt = prompt
        ? prompt.length > 20000
          ? prompt.slice(0, 20000)
          : prompt
        : "";

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_tokens: 4096,
       response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a professional ATS resume writer. Return ONLY valid JSON. Do not return markdown. Do not return explanations. Do not wrap JSON inside code blocks.",
          },
          {
            role: "user",
            content: `
Prompt:
${safePrompt || ""}

Resume Content:
${resumeText || "No resume uploaded"}

Generate a complete ATS resume and return ONLY this JSON structure:

{
  "name": "",
  "title": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "portfolio": "",
  "summary": "",
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "duration": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": ""
    }
  ],
  "certifications": [],
  "keywords": []
}
`,
          },
        ],
      });

      const rawResume = completion.choices?.[0]?.message?.content?.trim() || "";

      let resumeData;

      try {
        resumeData = JSON.parse(rawResume);
      } catch {
        return res.status(500).json({
          success: false,
          message: "Failed to generate structured resume",
        });
      }

      const atsResult = calculateAtsScore(resumeData);

      const pdfBuffer = await generateResumePdf(resumeData, finalTemplate);

      const savedResume = await Resume.create({
        userId: req.user ? req.user._id : null,
        email: req.user.email,
        prompt: safePrompt || null,
        resumeText: JSON.stringify(resumeData),
        pdf: pdfBuffer,
        template: finalTemplate,
        atsScore: atsResult.score,
        atsBreakdown: atsResult.breakdown,
      });

      res.status(200).json({
        success: true,
        resume: resumeData,
        resumeId: savedResume._id,
        pdf: pdfBuffer.toString("base64"),
        template: savedResume.template,
        atsScore: atsResult.score,
        atsBreakdown: atsResult.breakdown,
      });
    } catch (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "PDF size must not exceed 10MB.",
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

module.exports = router;