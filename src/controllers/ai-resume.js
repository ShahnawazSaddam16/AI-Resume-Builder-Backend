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

const upload = multer({
  storage: multer.memoryStorage(),
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

      if (req.file) {
        resumeText = await extractPdfText(req.file.buffer);
      }

      const safePrompt =
        prompt && prompt.length > 20000 ? prompt.slice(0, 20000) : prompt;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
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

      const rawResume =
        completion.choices?.[0]?.message?.content?.trim() || "";

      let resumeData;

      try {
        resumeData = JSON.parse(rawResume);
      } catch {
        return res.status(500).json({
          success: false,
          message: "Failed to generate structured resume",
        });
      }

      const pdfBuffer = await generateResumePdf(resumeData, template);

      const savedResume = await Resume.create({
        userId: req.user ? req.user._id : null,
        prompt: safePrompt || null,
        resumeText: JSON.stringify(resumeData),
        pdf: pdfBuffer,
        template: template || "blue"
      });

      res.status(200).json({
        success: true,
        resume: resumeData,
        resumeId: savedResume._id,
        pdf: pdfBuffer.toString("base64"),
        template: savedResume.template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;