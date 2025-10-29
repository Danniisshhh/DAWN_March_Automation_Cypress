const { defineConfig } = require("cypress");
const XLSX = require("xlsx");
const fs = require("fs");

module.exports = defineConfig({
  e2e: {
    specPattern: "**/*.cy.js",
    supportFile: false,
    viewportWidth: 1366,
    viewportHeight: 768,
    ensureScrollable: false,
    setupNodeEvents(on, config) {
      // Read Excel
      on("task", {
        readExcel({ filePath, sheetName }) {
          const workbook = XLSX.readFile(filePath);
          const sheet = workbook.Sheets[sheetName];
          return XLSX.utils.sheet_to_json(sheet, { defval: "" });
        },
        // Write Excel
        writeExcel({ filePath, sheetName, data }) {
          let workbook;
          if (fs.existsSync(filePath)) {
            workbook = XLSX.readFile(filePath);
          } else {
            workbook = XLSX.utils.book_new();
          }
          let sheet = workbook.Sheets[sheetName];
          let existingData = sheet ? XLSX.utils.sheet_to_json(sheet) : [];
          const updated = existingData.concat(data);
          const newSheet = XLSX.utils.json_to_sheet(updated);
          XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
          XLSX.writeFile(workbook, filePath);
          return null;
        }
      });
    },
  },
});
