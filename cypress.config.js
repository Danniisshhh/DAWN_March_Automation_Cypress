const { defineConfig } = require("cypress");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  e2e: {
    specPattern: "**/*.cy.js",
    supportFile: false,
    viewportWidth: 1366,
    viewportHeight: 768,
    ensureScrollable: false,

    // ⏱ increase task timeout
    taskTimeout: 120000,

    setupNodeEvents(on, config) {
      on("task", {
        readExcel({ filePath, sheetName }) {
          const absolutePath = path.resolve(filePath);

          if (!fs.existsSync(absolutePath)) {
            throw new Error(`❌ Excel file not found: ${absolutePath}`);
          }

          const workbook = XLSX.readFile(absolutePath);
          const sheet = workbook.Sheets[sheetName];

          if (!sheet) {
            throw new Error(`❌ Sheet "${sheetName}" not found in ${filePath}`);
          }

          return XLSX.utils.sheet_to_json(sheet, { defval: "" });
        },

        writeExcel({ filePath, sheetName, data }) {
          const absolutePath = path.resolve(filePath);
          let workbook;

          if (fs.existsSync(absolutePath)) {
            workbook = XLSX.readFile(absolutePath);
          } else {
            workbook = XLSX.utils.book_new();
          }

          const existingSheet = workbook.Sheets[sheetName];
          const existingData = existingSheet
            ? XLSX.utils.sheet_to_json(existingSheet)
            : [];

          const updatedData = existingData.concat(data);
          const newSheet = XLSX.utils.json_to_sheet(updatedData);

          workbook.Sheets[sheetName] = newSheet;
          if (!workbook.SheetNames.includes(sheetName)) {
            workbook.SheetNames.push(sheetName);
          }

          XLSX.writeFile(workbook, absolutePath);
          return null;
        },
      });
    },
  },

  projectId: "nmst9v",
});
