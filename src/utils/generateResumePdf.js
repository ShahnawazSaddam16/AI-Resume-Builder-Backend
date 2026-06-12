const PDFDocument = require("pdfkit");

const generateResumePdf = async (resume, template = "blue") => {
  const doc = new PDFDocument({
    margin: 50,
  });

  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const themes = {
    blue: {
      primary: "#2563eb",
      light: "#eff6ff",
      border: "#bfdbfe",
      tag: "#2563eb",
      text: "#111827",
      muted: "#6b7280",
    },
    green: {
      primary: "#16a34a",
      light: "#ecfdf5",
      border: "#a7f3d0",
      tag: "#16a34a",
      text: "#111827",
      muted: "#6b7280",
    },
    black: {
      primary: "#111827",
      light: "#f3f4f6",
      border: "#d1d5db",
      tag: "#111827",
      text: "#111827",
      muted: "#6b7280",
    },
    purple: {
      primary: "#7c3aed",
      light: "#f5f3ff",
      border: "#c4b5fd",
      tag: "#7c3aed",
      text: "#111827",
      muted: "#6b7280",
    },
    orange: {
      primary: "#ea580c",
      light: "#fff7ed",
      border: "#fed7aa",
      tag: "#ea580c",
      text: "#111827",
      muted: "#6b7280",
    },
    teal: {
      primary: "#0f766e",
      light: "#f0fdfa",
      border: "#99f6e4",
      tag: "#0f766e",
      text: "#111827",
      muted: "#6b7280",
    },
  };

  const theme = themes[template] || themes.blue;

  const maxWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const drawSkillTags = (skills) => {
    let x = doc.page.margins.left;
    let y = doc.y;

    skills.forEach((skill) => {
      const textWidth = doc.widthOfString(skill, { fontSize: 10 });
      const tagWidth = textWidth + 24;
      const tagHeight = 24;

      if (x + tagWidth > doc.page.margins.left + maxWidth) {
        x = doc.page.margins.left;
        y += 34;
      }

      doc
        .roundedRect(x, y, tagWidth, tagHeight, 8)
        .fillAndStroke(theme.light, theme.border);

      doc
        .fillColor(theme.tag)
        .fontSize(10)
        .text(skill, x + 12, y + 7, { lineBreak: false });

      x += tagWidth + 10;
    });

    doc.fillColor("#000000");
    doc.y = y + 40;
  };

  const drawBoxList = (items) => {
    let x = doc.page.margins.left;
    let y = doc.y;

    items.forEach((item) => {
      const text = typeof item === "string" ? item : item.name || "";

      const textWidth = doc.widthOfString(text, { fontSize: 11 });
      const boxWidth = textWidth + 30;
      const boxHeight = 28;

      if (x + boxWidth > doc.page.margins.left + maxWidth) {
        x = doc.page.margins.left;
        y += 38;
      }

      doc
        .roundedRect(x, y, boxWidth, boxHeight, 8)
        .fillAndStroke(theme.light, theme.border);

      doc
        .fillColor(theme.text)
        .fontSize(11)
        .text(text, x + 12, y + 8, { lineBreak: false });

      x += boxWidth + 10;
    });

    doc.fillColor("#000000");
    doc.y = y + 45;
  };

  const drawKeywordTags = (keywords) => {
    let x = doc.page.margins.left;
    let y = doc.y;

    keywords.forEach((keyword) => {
      const textWidth = doc.widthOfString(keyword, { fontSize: 10 });
      const tagWidth = textWidth + 24;
      const tagHeight = 24;

      if (x + tagWidth > doc.page.margins.left + maxWidth) {
        x = doc.page.margins.left;
        y += 34;
      }

      doc
        .roundedRect(x, y, tagWidth, tagHeight, 8)
        .fillAndStroke(theme.light, theme.border);

      doc
        .fillColor(theme.tag)
        .fontSize(10)
        .text(keyword, x + 12, y + 7, { lineBreak: false });

      x += tagWidth + 10;
    });

    doc.fillColor("#000000");
    doc.y = y + 40;
  };

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.fillColor(theme.primary);
    doc.fontSize(24).text("Professional Resume", { align: "center" });
    doc.moveDown(2);

    doc.fillColor("#000000");

    if (resume.name) doc.fontSize(20).text(resume.name);

    if (resume.title) {
      doc.fillColor(theme.muted).fontSize(14).text(resume.title);
      doc.fillColor("#000000");
    }

    doc.moveDown();

    if (resume.email) doc.fontSize(11).text(`Email: ${resume.email}`);
    if (resume.phone) doc.fontSize(11).text(`Phone: ${resume.phone}`);
    if (resume.location) doc.fontSize(11).text(`Location: ${resume.location}`);

    doc.moveDown();

    if (resume.summary) {
      doc.fontSize(16).fillColor(theme.primary).text("Professional Summary");
      doc.fillColor("#000000");
      doc.fontSize(11).text(resume.summary, { width: maxWidth });
      doc.moveDown();
    }

    if (resume.skills?.length) {
      doc.fontSize(16).fillColor(theme.primary).text("Skills");
      doc.moveDown(0.5);
      drawSkillTags(resume.skills);
      doc.moveDown();
    }

    if (resume.experience?.length) {
      doc.fontSize(16).fillColor(theme.primary).text("Experience");
      doc.fillColor("#000000");

      resume.experience.forEach((item) => {
        doc
          .fontSize(12)
          .text(`${item.role || ""} - ${item.company || ""}`, {
            width: maxWidth,
          });

        doc
          .fontSize(10)
          .fillColor(theme.muted)
          .text(item.duration || "", { width: maxWidth });

        doc.fillColor("#000000");

        doc.fontSize(11).text(item.description || "", {
          width: maxWidth,
        });

        doc.moveDown();
      });
    }

    if (resume.education?.length) {
      doc.fontSize(16).fillColor(theme.primary).text("Education");
      doc.fillColor("#000000");

      resume.education.forEach((item) => {
        doc.fontSize(12).text(item.institution || "", { width: maxWidth });
        doc.fontSize(11).text(item.degree || "", { width: maxWidth });
        doc
          .fontSize(10)
          .fillColor(theme.muted)
          .text(item.duration || "", { width: maxWidth });
        doc.fillColor("#000000");
        doc.moveDown();
      });
    }

    if (resume.projects?.length) {
      doc.fontSize(16).fillColor(theme.primary).text("Projects");
      doc.fillColor("#000000");
      drawBoxList(resume.projects);
    }

    if (resume.certifications?.length) {
      doc.fontSize(16).fillColor(theme.primary).text("Certifications");
      doc.fillColor("#000000");
      doc
        .fontSize(11)
        .text(resume.certifications.join("\n"), { width: maxWidth });
      doc.moveDown();
    }

    if (resume.keywords?.length) {
      doc.fontSize(16).fillColor(theme.primary).text("ATS Keywords");
      doc.fillColor("#000000");
      drawKeywordTags(resume.keywords);
    }

    doc.end();
  });
};

module.exports = generateResumePdf;