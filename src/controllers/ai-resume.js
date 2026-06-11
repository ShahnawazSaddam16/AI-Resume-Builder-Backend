require("dotenv").config();
const express = require("express");
const router = express.Router();
const limiter = require("../middleware/limiter");
const multer = require("multer");
const PDFParser = require("pdf2json");
const Groq = require("groq-sdk");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createClient } = require("@supabase/supabase-js");
const Plan = require("../Models/plan");
const WebSocket = require("ws");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: WebSocket
    }
  }
);

const upload = multer({
  storage: multer.memoryStorage(),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const extractPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", reject);

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      pdfData.Pages.forEach((page) => {
        page.Texts.forEach((item) => {
          item.R.forEach((run) => {
            text += decodeURIComponent(run.T) + " ";
          });
        });
      });

      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
};

router.post(
  "/ai-resume",
  limiter,
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      const { prompt } = req.body;

      let resumeText = "";
      let limit = 1;

      const userPlan = await Plan.findOne({
        userId: req.user._id,
      });

      if (userPlan) {
        if (userPlan.planStatus === "pro") limit = 200;
        else if (userPlan.planStatus === "elite") limit = 500;
      }

      const { count: userResumeCount, error: countError } = await supabase
        .from("userResumes")
        .select("*", { count: "exact", head: true })
        .eq("userId", req.user._id);

      if (countError) {
        return res.status(500).json({
          success: false,
          message: countError.message,
        });
      }

      if ((userResumeCount || 0) >= limit) {
        return res.status(403).json({
          success: false,
          message: "Plan limit reached. Upgrade your plan.",
        });
      }

      if (req.file) {
        resumeText = await extractPdfText(req.file.buffer);
      }

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a professional ATS resume writer. Generate complete ATS optimized resumes.",
          },
          {
            role: "user",
            content: `
Prompt:
${prompt || ""}

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

      const channel = supabase.channel("resume-updates");

      await supabase.from("userResumes").insert([
        {
          userId: req.user._id,
          prompt: prompt || "",
          resume,
          createdAt: new Date(),
        },
      ]);

      await supabase.from("resumes_history").insert([
        {
          userId: req.user._id,
          prompt: prompt || "",
          resume,
          createdAt: new Date(),
        },
      ]);

      channel.send({
        type: "broadcast",
        event: "new-resume",
        payload: {
          userId: req.user._id,
          resume,
        },
      });

      res.status(200).json({
        success: true,
        resume,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;