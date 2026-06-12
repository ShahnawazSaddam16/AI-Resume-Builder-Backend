require("dotenv").config();
const express = require("express");
const router = express.Router();
const limiter = require("../middleware/limiter");
const multer = require("multer");
const Groq = require("groq-sdk");
const PDFDocument = require("pdfkit");
const Resume = require("../Models/ai-resumer");
const { authMiddleware } = require("../middleware/authMiddleware");
const extractPdfText = require("../utils/extractPdfText");
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
      const { prompt } = req.body;

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
              "You are a professional ATS resume writer. Generate complete ATS optimized resumes. User may provide long input up to 2000 lines; handle it efficiently without truncation unless necessary.",
          },
          {
            role: "user",
            content: `
Prompt:
${safePrompt || ""}

Resume Content:
${resumeText || "No resume uploaded"}

Generate:
Professional Summary
Skills
Experience
Education
Projects
Certifications
ATS Keywords
Professional Resume
`,
          },
        ],
      });

      const resume = completion.choices?.[0]?.message?.content || "";

      const doc = new PDFDocument({
        margin: 50,
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));

      const pdfBuffer = await new Promise((resolve) => {
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        doc.fillColor("#2563eb");
        doc.fontSize(24);
        doc.text("Professional Resume", {
          align: "center",
        });

        doc.moveDown();

        doc.fillColor("#000000");
        doc.fontSize(11);
        doc.text(resume, {
          align: "left",
        });

        doc.end();
      });

      const savedResume = await Resume.create({
        userId: req.user ? req.user._id : null,
        prompt: safePrompt || null,
        resumeText: resume,
        pdf: pdfBuffer,
      });

      res.status(200).json({
        success: true,
        resume,
        resumeId: savedResume._id,
        pdf: pdfBuffer.toString("base64"),
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