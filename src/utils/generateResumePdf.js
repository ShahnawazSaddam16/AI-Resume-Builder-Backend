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

    doc.moveDown();

    doc.fillColor("#000000");
    doc.fontSize(11);
    doc.text(resume, {
      align: "left",
    });

    doc.end();
  });
};

module.exports = generateResumePdf;