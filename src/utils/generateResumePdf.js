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
      background: "#ffffff",
    },
    green: {
      primary: "#16a34a",
      light: "#ecfdf5",
      border: "#a7f3d0",
      tag: "#16a34a",
      text: "#111827",
      muted: "#6b7280",
      background: "#ffffff",
    },
    black: {
      primary: "#ffffff",
      light: "#1f2937",
      border: "#374151",
      tag: "#ffffff",
      text: "#ffffff",
      muted: "#9ca3af",
      background: "#000000",
    },
    purple: {
      primary: "#7c3aed",
      light: "#f5f3ff",
      border: "#c4b5fd",
      tag: "#7c3aed",
      text: "#111827",
      muted: "#6b7280",
      background: "#ffffff",
    },
    orange: {
      primary: "#ea580c",
      light: "#fff7ed",
      border: "#fed7aa",
      tag: "#ea580c",
      text: "#111827",
      muted: "#6b7280",
      background: "#ffffff",
    },
    teal: {
      primary: "#0f766e",
      light: "#f0fdfa",
      border: "#99f6e4",
      tag: "#0f766e",
      text: "#111827",
      muted: "#6b7280",
      background: "#ffffff",
    },
  };

  const theme = themes[template] || themes.blue;

  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const maxWidth = doc.page.width - marginLeft - marginRight;

  const colGap = 24;
  const leftColWidth = Math.round(maxWidth * 0.62);
  const rightColWidth = maxWidth - leftColWidth - colGap;
  const leftColX = marginLeft;
  const rightColX = marginLeft + leftColWidth + colGap;

  const fillBackground = () => {
    doc
      .rect(0, 0, doc.page.width, doc.page.height)
      .fill(theme.background);
    doc.fillColor(theme.text);
  };

  doc.on("pageAdded", fillBackground);
  fillBackground();

  const sectionTitle = (title, x, width) => {
    doc.x = x;
    doc.moveDown(0.6);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(theme.primary)
      .text(title.toUpperCase(), x, doc.y, { width, characterSpacing: 1 });

    const lineY = doc.y + 4;
    doc
      .moveTo(x, lineY)
      .lineTo(x + width, lineY)
      .lineWidth(1)
      .strokeColor(theme.border)
      .stroke();

    doc.fillColor(theme.text);
    doc.x = x;
    doc.y = lineY + 10;
  };

  const drawTagColumn = (items, getLabel, x, width) => {
    let y = doc.y;
    const tagHeight = 22;
    const rowGap = 8;
    const bottomLimit = doc.page.height - doc.page.margins.bottom;

    items.forEach((item) => {
      const label = getLabel(item);

      if (y + tagHeight > bottomLimit) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc
        .roundedRect(x, y, width, tagHeight, 6)
        .fillAndStroke(theme.light, theme.border);

      doc
        .fillColor(theme.tag)
        .font("Helvetica")
        .fontSize(9.5)
        .text(label, x + 10, y + 6, { width: width - 20, height: tagHeight, lineBreak: false });

      y += tagHeight + rowGap;
    });

    doc.fillColor(theme.text);
    doc.x = x;
    doc.y = y + rowGap;
  };

  const drawTagRow = (items, getLabel, x, width) => {
    let cx = x;
    let y = doc.y;
    const tagHeight = 24;
    const rowGap = 10;
    const bottomLimit = doc.page.height - doc.page.margins.bottom;

    items.forEach((item) => {
      const label = getLabel(item);
      const textWidth = doc.font("Helvetica").fontSize(10).widthOfString(label);
      const tagWidth = textWidth + 24;

      if (cx + tagWidth > x + width) {
        cx = x;
        y += tagHeight + rowGap;
      }

      if (y + tagHeight > bottomLimit) {
        doc.addPage();
        y = doc.page.margins.top;
        cx = x;
      }

      doc
        .roundedRect(cx, y, tagWidth, tagHeight, 8)
        .fillAndStroke(theme.light, theme.border);

      doc
        .fillColor(theme.tag)
        .font("Helvetica")
        .fontSize(10)
        .text(label, cx + 12, y + 7, { lineBreak: false });

      cx += tagWidth + rowGap;
    });

    doc.fillColor(theme.text);
    doc.x = x;
    doc.y = y + tagHeight + rowGap;
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
      sectionTitle("Professional Summary", marginLeft, maxWidth);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(theme.text)
        .text(resume.summary, { width: maxWidth, lineGap: 3 });
    }

    const columnsStartY = doc.y + 10;
    let leftY = columnsStartY;
    let rightY = columnsStartY;

    if (resume.experience?.length) {
      doc.x = leftColX;
      doc.y = leftY;
      sectionTitle("Experience", leftColX, leftColWidth);

      resume.experience.forEach((item, index) => {
        if (index > 0) doc.moveDown(0.8);

        doc.x = leftColX;
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(theme.text)
          .text(item.role || "", leftColX, doc.y, { width: leftColWidth });

        if (item.company) {
          doc.x = leftColX;
          doc
            .font("Helvetica")
            .fontSize(11)
            .fillColor(theme.primary)
            .text(item.company, leftColX, doc.y, { width: leftColWidth });
        }

        if (item.duration) {
          doc.x = leftColX;
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor(theme.muted)
            .text(item.duration, leftColX, doc.y, { width: leftColWidth });
        }

        doc.fillColor(theme.text);

        if (item.description) {
          doc.moveDown(0.3);
          doc.x = leftColX;
          doc
            .font("Helvetica")
            .fontSize(10.5)
            .fillColor(theme.text)
            .text(item.description, leftColX, doc.y, {
              width: leftColWidth,
              lineGap: 3,
              align: "justify",
            });
        }
      });

      doc.moveDown(0.4);
    }

    if (resume.projects?.length) {
      doc.x = leftColX;
      sectionTitle("Projects", leftColX, leftColWidth);

      resume.projects.forEach((proj, index) => {
        if (index > 0) doc.moveDown(0.6);

        const name = typeof proj === "string" ? proj : proj.name || "";
        const description = typeof proj === "string" ? "" : proj.description || "";

        doc.x = leftColX;
        doc
          .font("Helvetica-Bold")
          .fontSize(11.5)
          .fillColor(theme.text)
          .text(name, leftColX, doc.y, { width: leftColWidth });

        if (description) {
          doc.moveDown(0.2);
          doc.x = leftColX;
          doc
            .font("Helvetica")
            .fontSize(10.5)
            .fillColor(theme.text)
            .text(description, leftColX, doc.y, {
              width: leftColWidth,
              lineGap: 3,
              align: "justify",
            });
        }
      });

      doc.moveDown(0.4);
    }

    if (resume.education?.length) {
      doc.x = leftColX;
      sectionTitle("Education", leftColX, leftColWidth);

      resume.education.forEach((item, index) => {
        if (index > 0) doc.moveDown(0.6);

        doc.x = leftColX;
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(theme.text)
          .text(item.institution || "", leftColX, doc.y, { width: leftColWidth });

        if (item.degree) {
          doc.x = leftColX;
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor(theme.primary)
            .text(item.degree, leftColX, doc.y, { width: leftColWidth });
        }

        if (item.duration) {
          doc.x = leftColX;
          doc
            .font("Helvetica")
            .fontSize(9.5)
            .fillColor(theme.muted)
            .text(item.duration, leftColX, doc.y, { width: leftColWidth });
        }

        doc.fillColor(theme.text);
      });

      doc.moveDown(0.4);
    }

    leftY = doc.y;

    if (resume.certifications?.length) {
      doc.x = rightColX;
      doc.y = rightY;
      sectionTitle("Certifications", rightColX, rightColWidth);

      resume.certifications.forEach((cert) => {
        doc.x = rightColX;
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(theme.text)
          .text(`•  ${cert}`, rightColX, doc.y, { width: rightColWidth, lineGap: 4 });
      });

      doc.moveDown(0.4);
      rightY = doc.y;
    }

    if (resume.keywords?.length) {
      doc.x = rightColX;
      doc.y = rightY;
      sectionTitle("ATS Keywords", rightColX, rightColWidth);
      drawTagColumn(resume.keywords, (k) => k, rightColX, rightColWidth);
      rightY = doc.y;
    }

    doc.y = Math.max(leftY, rightY);

    if (resume.skills?.length) {
      doc.x = marginLeft;
      sectionTitle("Skills", marginLeft, maxWidth);
      drawTagRow(resume.skills, (s) => s, marginLeft, maxWidth);
    }

    doc.end();
  });
};

module.exports = generateResumePdf;