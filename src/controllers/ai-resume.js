require("dotenv").config();
const express = require("express");
const router = express.Router();
const limiter = require("../middleware/limiter");
const multer = require("multer");
const PDFParser = require("pdf2json");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const upload = multer({
  storage: multer.memoryStorage(),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,{
    realtime:{
        transport: WebSocket
    }
  }
);

const extractPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) => {
      reject(err);
    });

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
  upload.single("resume"),
  async (req, res) => {
    try {
      const { prompt, userId } = req.body;

      let resumeText = "";

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

      const { error } = await supabase.from("resumes").insert([
        {
          user_id: userId || null,
          prompt: prompt || null,
          resume_text: resume,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(200).json({
        success: true,
        resume,
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