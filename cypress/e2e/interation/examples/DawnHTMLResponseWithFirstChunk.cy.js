/// <reference types="cypress" />

describe("Chatbot Automation", () => {
  it("Dawn", () => {
    const BOT_SELECTOR =
      ".btc_chat_card_bot_span_msg, .chat-messages .assistant, .chat-messages .bot";
    const USER_SELECTOR = ".btc_chat_card_user";

    cy.visit("https://chat-myair.dawn-us-dev.dht.live/");
    cy.wait(15000);
    cy.get(".btn").click();
    cy.wait(10000);


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
      filePath: "cypress/fixtures/updated_myAir_Dawn_US_4_4_0_vivek_part_2_complex_queries.xlsx",
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

        cy.then(() => {
          const prevCount = Cypress.$(BOT_SELECTOR).length;
          const prevText =
            prevCount > 0 ? Cypress.$(BOT_SELECTOR).last().text().trim() : "";

          const sendAt = Date.now();
          const sendAtISO = new Date(sendAt).toISOString();
          cy.get(".chatbox_btn").click({ force: true });

          // wait for first chunk
          cy.get(BOT_SELECTOR, { timeout: 60000 })
            .should(($els) => {
              const newCount = $els.length;
              const lastText = newCount > 0 ? $els.last().text().trim() : "";

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

        cy.wait(500); // small buffer
      })
        .then(() => {
          // Save timing data as JSON and CSV
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

          // ---- dump the full conversation (queries + responses) into HTML ----
          cy.get("div.chatbox__messages", { timeout: 20000 }).then(($container) => {
            const queriesList = [];
            const responsesList = [];

            // Collect queries (plain text)
            $container.find(USER_SELECTOR).each((i, el) => {
              queriesList.push(Cypress.$(el).text().trim());
            });

            // Collect responses (HTML + clickable links)
            $container.find(".btc_chat_card_bot_span_msg").each((i, el) => {
              let resp = Cypress.$(el).html().trim();

              // Make bare URLs / PDFs clickable if not already wrapped
              resp = resp.replace(
                /(https?:\/\/[^\s<]+|[A-Za-z0-9_-]+\.pdf)/g,
                (match) => {
                  if (match.startsWith("http") || match.endsWith(".pdf")) {
                    return `<a href="${match}" target="_blank">${match}</a>`;
                  }
                  return match;
                }
              );

              responsesList.push(resp);
            });

            // Build HTML output
            let html = `<html><head>
            <meta charset="utf-8"/>
            <title>Chatbot Results</title>
            <style>
              body{font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:920px;margin:24px auto;padding:0 12px;}
              .row{padding:12px 0;border-bottom:1px solid #eee;}
              .q{margin:0 0 8px;font-weight:600;}
              .resp{white-space:pre-wrap;margin:0;}
              .resp a{color:#0645ad;text-decoration:underline;}
            </style></head><body>`;
            html += `<h1>Chatbot Run – ${new Date().toISOString()}</h1>`;

            for (let i = 0; i < Math.max(queriesList.length, responsesList.length); i++) {
              html += `<div class="row">`;
              html += `<p class="q">Query #${i + 1}: ${queriesList[i] || ""}</p>`;
              html += `<p class="resp"><strong>Response:</strong> ${responsesList[i] || ""}</p>`;
              html += `</div>`;
            }

            html += `</body></html>`;

            // Save to file
            cy.writeFile("cypress/results/full_records.html", html);
          });
        });
    });
  });
});
