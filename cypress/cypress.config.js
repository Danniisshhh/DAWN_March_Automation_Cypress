const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        readExcel({ filePath, sheetName }) {
          const XLSX = require('xlsx');
          const workbook = XLSX.readFile(filePath);
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          return json;
        }
      });
    },
  },
});
