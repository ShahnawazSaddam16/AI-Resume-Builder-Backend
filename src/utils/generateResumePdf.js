const PDFDocument = require("pdfkit");

const generateResumePdf = async (resume) => {
  const doc = new PDFDocument({
    margin: 50,
  });

  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.fillColor("#2563eb");
    doc.fontSize(24);
    doc.text("Professional Resume", {
      align: "center",
    });

    doc.moveDown(2);

    doc.fillColor("#000000");

    if (resume.name) {
      doc.fontSize(20).text(resume.name);
    }

    if (resume.title) {
      doc.fontSize(14).text(resume.title);
    }

    doc.moveDown();

    if (resume.email) {
      doc.fontSize(11).text(`Email: ${resume.email}`);
    }

    if (resume.phone) {
      doc.fontSize(11).text(`Phone: ${resume.phone}`);
    }

    if (resume.location) {
      doc.fontSize(11).text(`Location: ${resume.location}`);
    }

    doc.moveDown();

    if (resume.summary) {
      doc.fontSize(16).fillColor("#2563eb").text("Professional Summary");
      doc.fillColor("#000000");
      doc.fontSize(11).text(resume.summary);
      doc.moveDown();
    }

    if (resume.skills?.length) {
      doc.fontSize(16).fillColor("#2563eb").text("Skills");
      doc.fillColor("#000000");
      doc.fontSize(11).text(resume.skills.join(", "));
      doc.moveDown();
    }

    if (resume.experience?.length) {
      doc.fontSize(16).fillColor("#2563eb").text("Experience");
      doc.fillColor("#000000");

      resume.experience.forEach((item) => {
        doc.fontSize(12).text(`${item.role || ""} - ${item.company || ""}`);
        doc.fontSize(10).text(item.duration || "");
        doc.fontSize(11).text(item.description || "");
        doc.moveDown();
      });
    }

    if (resume.education?.length) {
      doc.fontSize(16).fillColor("#2563eb").text("Education");
      doc.fillColor("#000000");

      resume.education.forEach((item) => {
        doc.fontSize(12).text(item.institution || "");
        doc.fontSize(11).text(item.degree || "");
        doc.fontSize(10).text(item.duration || "");
        doc.moveDown();
      });
    }

    if (resume.projects?.length) {
      doc.fontSize(16).fillColor("#2563eb").text("Projects");
      doc.fillColor("#000000");

      resume.projects.forEach((item) => {
        doc.fontSize(12).text(item.name || "");
        doc.fontSize(11).text(item.description || "");
        doc.moveDown();
      });
    }

    if (resume.certifications?.length) {
      doc.fontSize(16).fillColor("#2563eb").text("Certifications");
      doc.fillColor("#000000");
      doc.fontSize(11).text(resume.certifications.join("\n"));
      doc.moveDown();
    }

    if (resume.keywords?.length) {
      doc.fontSize(16).fillColor("#2563eb").text("ATS Keywords");
      doc.fillColor("#000000");
      doc.fontSize(11).text(resume.keywords.join(", "));
    }

    doc.end();
  });
};

module.exports = generateResumePdf;