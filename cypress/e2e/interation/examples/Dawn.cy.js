/// <reference types="cypress" />

describe("Chatbot Automation", () => {
  it("Dawn", () => {
    cy.visit("https://chat-myair.dawn-us-pre-prod.dht.live/");
    cy.wait(10000);
    cy.get(".btn").click();

    cy.get("body").then(($body) => {
      if ($body.find("#exampleInputName").length > 0) {
        // Login flow
        cy.get("#exampleInputName").type("Danish");
        cy.get("#exampleInputEmail1").type("danish@bitcot.com");
        cy.get(".terms_and_agree_checkbox > label").click();
        cy.get(".font-btn").click();
        cy.get(".font-btn").click();

        cy.get(".terms_conditon_scroll", { timeout: 10000 }).then(() => {
          cy.get(".terms_conditon_scroll").scrollTo("bottom", { duration: 2000 });
          cy.get(".terms_agree_btn").click();
        });
      }
    });

    cy.log("Login Done");

    cy.task("readExcel", {
      filePath: "cypress/fixtures/Dawn_US_stage_QA_2025.xlsx",
      sheetName: "Sheet1",
    }).then((rows) => {
      const queries = rows
        .map((r) =>
          Array.isArray(r)
            ? r[0]
            : r && typeof r === "object"
            ? r.Query ??
              r.query ??
              r.Question ??
              r.question ??
              Object.values(r)[0]
            : r
        )
        .map((q) => (q == null ? "" : String(q).trim()))
        .filter((q) => q.length > 0);

      const timings = [];

      cy.wrap(queries).each((query, i) => {
        cy.log(`Query #${i + 1}: ${query}`);

        cy.get("textarea#myTextArea", { timeout: 60000 })
          .should("be.visible")
          .should("not.have.attr", "disabled");

        const start = Date.now();

        cy.get("textarea#myTextArea")
          .clear({ force: true })
          .type(query, { delay: 50, force: true });

        cy.get(".chatbox_btn").click({ force: true });

        cy.get("textarea#myTextArea", { timeout: 60000 }).should("have.attr", "disabled");
        cy.get("textarea#myTextArea", { timeout: 60000 })
          .should("not.have.attr", "disabled")
          .then(() => {
            const ms = Date.now() - start;
            timings.push({ index: i + 1, query, ms_to_ready: ms });
            cy.log(`⏱ #${i + 1}: ${ms} ms`);
          });

        cy.wait(500);
      })
      // 👇 key: use cy.then so Cypress waits for .each() to finish before writing
      .then(() => {
        cy.then(() => {
          const out = {
            runAt: new Date().toISOString(),
            count: timings.length,
            items: timings,
          };

          const toCsv = (rows) => {
            const header = "index,ms_to_ready,query\n";
            const lines = rows
              .map(
                (r) =>
                  `${r.index},${r.ms_to_ready},"${String(r.query).replace(/"/g, '""')}"`
              )
              .join("\n");
            return header + lines;
          };

          cy.writeFile("cypress/results/responses.json", out);
          cy.writeFile("cypress/results/responses.csv", toCsv(timings));
        });
      });
    });
  });
});
