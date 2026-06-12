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

  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const maxWidth = doc.page.width - marginLeft - marginRight;

  const sectionTitle = (title) => {
    doc.moveDown(0.6);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(theme.primary)
      .text(title.toUpperCase(), { characterSpacing: 1 });

    const lineY = doc.y + 4;
    doc
      .moveTo(marginLeft, lineY)
      .lineTo(marginLeft + maxWidth, lineY)
      .lineWidth(1)
      .strokeColor(theme.border)
      .stroke();

    doc.fillColor(theme.text);
    doc.y = lineY + 10;
  };

  const drawTagRow = (items, getLabel) => {
    let x = marginLeft;
    let y = doc.y;
    const tagHeight = 24;
    const rowGap = 10;

    items.forEach((item) => {
      const label = getLabel(item);
      const textWidth = doc.font("Helvetica").fontSize(10).widthOfString(label);
      const tagWidth = textWidth + 24;

      if (x + tagWidth > marginLeft + maxWidth) {
        x = marginLeft;
        y += tagHeight + rowGap;
      }

      doc
        .roundedRect(x, y, tagWidth, tagHeight, 8)
        .fillAndStroke(theme.light, theme.border);

      doc
        .fillColor(theme.tag)
        .font("Helvetica")
        .fontSize(10)
        .text(label, x + 12, y + 7, { lineBreak: false });

      x += tagWidth + rowGap;
    });

    doc.fillColor(theme.text);
    doc.y = y + tagHeight + 16;
  };

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    if (resume.name) {
      doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor(theme.text)
        .text(resume.name, { align: "center" });
    }

    if (resume.title) {
      doc
        .font("Helvetica")
        .fontSize(13)
        .fillColor(theme.primary)
        .text(resume.title, { align: "center" });
    }

    doc.moveDown(0.5);

    const contactParts = [];
    if (resume.email) contactParts.push(resume.email);
    if (resume.phone) contactParts.push(resume.phone);
    if (resume.location) contactParts.push(resume.location);

    if (contactParts.length) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(theme.muted)
        .text(contactParts.join("   |   "), { align: "center" });
    }

    doc.moveDown(0.8);

    const headerLineY = doc.y;
    doc
      .moveTo(marginLeft, headerLineY)
      .lineTo(marginLeft + maxWidth, headerLineY)
      .lineWidth(1.5)
      .strokeColor(theme.primary)
      .stroke();

    doc.y = headerLineY + 16;
    doc.fillColor(theme.text);

    if (resume.summary) {
      sectionTitle("Professional Summary");
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(theme.text)
        .text(resume.summary, { width: maxWidth, lineGap: 3 });
    }

    if (resume.skills?.length) {
      sectionTitle("Skills");
      drawTagRow(resume.skills, (s) => s);
    }

    if (resume.experience?.length) {
      sectionTitle("Experience");

      resume.experience.forEach((item, index) => {
        if (index > 0) doc.moveDown(0.6);

        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(theme.text)
          .text(item.role || "", { continued: false, width: maxWidth });

        const companyLineY = doc.y;
        doc
          .font("Helvetica")
          .fontSize(11)
          .fillColor(theme.primary)
          .text(item.company || "", { width: maxWidth - 140 });

        if (item.duration) {
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor(theme.muted)
            .text(item.duration, marginLeft + maxWidth - 140, companyLineY, {
              width: 140,
              align: "right",
            });
        }

        doc.fillColor(theme.text);
        doc.y = Math.max(doc.y, companyLineY + 16);

        if (item.description) {
          doc.moveDown(0.2);
          doc
            .font("Helvetica")
            .fontSize(10.5)
            .fillColor(theme.text)
            .text(item.description, { width: maxWidth, lineGap: 2 });
        }
      });

      doc.moveDown(0.4);
    }

    if (resume.education?.length) {
      sectionTitle("Education");

      resume.education.forEach((item, index) => {
        if (index > 0) doc.moveDown(0.5);

        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(theme.text)
          .text(item.institution || "", { width: maxWidth });

        const degreeLineY = doc.y;
        doc
          .font("Helvetica")
          .fontSize(11)
          .fillColor(theme.primary)
          .text(item.degree || "", { width: maxWidth - 140 });

        if (item.duration) {
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor(theme.muted)
            .text(item.duration, marginLeft + maxWidth - 140, degreeLineY, {
              width: 140,
              align: "right",
            });
        }

        doc.fillColor(theme.text);
        doc.y = Math.max(doc.y, degreeLineY + 16);
      });

      doc.moveDown(0.4);
    }

    if (resume.projects?.length) {
      sectionTitle("Projects");
      drawTagRow(resume.projects, (p) => (typeof p === "string" ? p : p.name || ""));
    }

    if (resume.certifications?.length) {
      sectionTitle("Certifications");
      resume.certifications.forEach((cert) => {
        doc
          .font("Helvetica")
          .fontSize(11)
          .fillColor(theme.text)
          .text(`•  ${cert}`, { width: maxWidth, lineGap: 4 });
      });
      doc.moveDown(0.4);
    }

    if (resume.keywords?.length) {
      sectionTitle("ATS Keywords");
      drawTagRow(resume.keywords, (k) => k);
    }

    doc.end();
  });
};

module.exports = generateResumePdf;