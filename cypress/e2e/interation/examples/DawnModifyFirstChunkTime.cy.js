/// <reference types="cypress" />

describe("Chatbot Automation", () => {
  it("Dawn", () => {
    // used to detect the first visible bot message (first chunk)
    const BOT_SELECTOR =
      ".btc_chat_card_bot_span_msg, .chat-messages .assistant, .chat-messages .bot";

    cy.visit("https://chat-myair.dawn-us-dev.dht.live/");
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

        cy.log("Login Done");

        cy.task("readExcel", {
          filePath: "cypress/fixtures/danish_mtn.xlsx",
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

            // ensure the textarea is present and ready
            cy.get("textarea#myTextArea", { timeout: 60000 })
              .should("be.visible")
              .clear({ force: true })
              .type(query, { delay: 50, force: true });

            // ---- SAFE PRE-READ OF CURRENT BOT STATE (no hard get/should) ----
            cy.then(() => {
              const prevCount = Cypress.$(BOT_SELECTOR).length;
              const prevText =
                prevCount > 0 ? Cypress.$(BOT_SELECTOR).last().text().trim() : "";

              // ---- send + timing at the click moment (your line ~64) ----
              const sendAt = Date.now();
              const sendAtISO = new Date(sendAt).toISOString();
              cy.get(".chatbox_btn").click({ force: true });

              // ---- wait for first chunk: new bubble OR text growth on last bubble ----
              cy.get(BOT_SELECTOR, { timeout: 60000 })
                .should(($els) => {
                  const newCount = $els.length;
                  const lastText = newCount > 0 ? $els.last().text().trim() : "";

                  // if no bubbles existed, require at least one now
                  // otherwise require either more bubbles or changed text
                  const ok =
                    prevCount === 0
                      ? newCount > 0
                      : newCount > prevCount || lastText !== prevText;

                  expect(ok, "bot message appeared or updated").to.be.true;
                })
                .then(() => {
                  const firstChunkAt = Date.now();
                  const firstChunkISO = new Date(firstChunkAt).toISOString();
                  const ms = firstChunkAt - sendAt;

                  timings.push({
                    index: i + 1,
                    query,
                    send_at: sendAtISO,
                    first_chunk_at: firstChunkISO,
                    ms_to_first_chunk: ms,
                  });

                  cy.log(
                    `⏱ #${i + 1}: sent=${sendAtISO}, firstChunk=${firstChunkISO}, Δ=${ms} ms`
                  );
                });
            });

            cy.wait(500); // small buffer between queries
          })
            // write results once all queries are processed
            .then(() => {
              cy.then(() => {
                const out = {
                  runAt: new Date().toISOString(),
                  count: timings.length,
                  items: timings,
                };

                const toCsv = (rows) => {
                  const header =
                    "index,send_at,first_chunk_at,ms_to_first_chunk,query\n";
                  const lines = rows
                    .map(
                      (r) =>
                        `${r.index},${r.send_at},${r.first_chunk_at},${r.ms_to_first_chunk},"${String(
                          r.query
                        ).replace(/"/g, '""')}"`,
                    )
                    .join("\n");
                  return header + lines;
                };

                cy.writeFile("cypress/results/response.json", out);
                cy.writeFile("cypress/results/responses.csv", toCsv(timings));
              });
            });
        });
      }
      else {
        cy.wait(2500); 
        cy.log("Login Done");
       cy.get('.terms_agree_agree_btn').click();

        cy.task("readExcel", {
          filePath: "cypress/fixtures/MTN.xlsx",
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

            // ensure the textarea is present and ready
            cy.get("textarea#myTextArea", { timeout: 60000 })
              .should("be.visible")
              .clear({ force: true })
              .type(query, { delay: 50, force: true });

            // ---- SAFE PRE-READ OF CURRENT BOT STATE (no hard get/should) ----
            cy.then(() => {
              const prevCount = Cypress.$(BOT_SELECTOR).length;
              const prevText =
                prevCount > 0 ? Cypress.$(BOT_SELECTOR).last().text().trim() : "";

              // ---- send + timing at the click moment (your line ~64) ----
              const sendAt = Date.now();
              const sendAtISO = new Date(sendAt).toISOString();
              cy.get(".chatbox_btn").click({ force: true });

              // ---- wait for first chunk: new bubble OR text growth on last bubble ----
              cy.get(BOT_SELECTOR, { timeout: 60000 })
                .should(($els) => {
                  const newCount = $els.length;
                  const lastText = newCount > 0 ? $els.last().text().trim() : "";

                  // if no bubbles existed, require at least one now
                  // otherwise require either more bubbles or changed text
                  const ok =
                    prevCount === 0
                      ? newCount > 0
                      : newCount > prevCount || lastText !== prevText;

                  expect(ok, "bot message appeared or updated").to.be.true;
                })
                .then(() => {
                  const firstChunkAt = Date.now();
                  const firstChunkISO = new Date(firstChunkAt).toISOString();
                  const ms = firstChunkAt - sendAt;

                  timings.push({
                    index: i + 1,
                    query,
                    send_at: sendAtISO,
                    first_chunk_at: firstChunkISO,
                    ms_to_first_chunk: ms,
                  });

                  cy.log(
                    `⏱ #${i + 1}: sent=${sendAtISO}, firstChunk=${firstChunkISO}, Δ=${ms} ms`
                  );
                });
            });

            cy.wait(500); // small buffer between queries
          })
            // write results once all queries are processed
            .then(() => {
              cy.then(() => {
                const out = {
                  runAt: new Date().toISOString(),
                  count: timings.length,
                  items: timings,
                };

                const toCsv = (rows) => {
                  const header =
                    "index,send_at,first_chunk_at,ms_to_first_chunk,query\n";
                  const lines = rows
                    .map(
                      (r) =>
                        `${r.index},${r.send_at},${r.first_chunk_at},${r.ms_to_first_chunk},"${String(
                          r.query
                        ).replace(/"/g, '""')}"`,
                    )
                    .join("\n");
                  return header + lines;
                };

                cy.writeFile("cypress/results/response.json", out);
                cy.writeFile("cypress/results/responses.csv", toCsv(timings));
              });
            });
        });
      }
    });

  });
});
