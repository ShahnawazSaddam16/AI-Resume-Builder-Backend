const PDFParser = require("pdf2json");

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

module.exports = extractPdfText;