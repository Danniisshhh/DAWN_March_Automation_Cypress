/// <reference types="cypress" />

/**
 * Cypress script for chatbot automation with:
 *  - Pre-injection of chatbotConfig (MTN mock user)
 *  - No token / no expiry
 *  - Result export (JSON, CSV, HTML)
 */

describe("Chatbot Automation - MTN mock user (no token)", () => {
  it("Dawn", () => {
    const BOT_SELECTOR =
      ".btc_chat_card_bot_span_msg, .chat-messages .assistant, .chat-messages .bot";
    const USER_SELECTOR = ".btc_chat_card_user";
    const CHAT_URL = "https://chat-myair.va-dev.dht.live/";

    // ✅ MTN MOCK CONFIG (no token required)
    const chatbotConfig = {
      name: "dev",
      email: "devtest@bitcot.com",
      patient_id: "100",
      my_therapy_navigator_enabled: true,
      my_therapy_navigator_opt_out: false,
      is_mtn_mock_user: true,
    };

    // 1️⃣ Visit & inject config BEFORE app loads
    cy.visit(CHAT_URL, {
      onBeforeLoad(win) {
        win.chatbotConfig = chatbotConfig;

        win.__test_helpers__ = {
          getChatbotConfig: () => win.chatbotConfig,
        };
      },
    });

    cy.wait(6000);

    // 2️⃣ Click “Chat with us”
    cy.get(".btn", { timeout: 20000 })
      .should("be.visible")
      .click({ force: true });

    cy.wait(6000);

    cy.log("✅ ChatbotConfig injected and chat opened");

    // 3️⃣ Load Excel queries
    cy.task("readExcel", {
      filePath:
        "cypress/fixtures/updated_myAir_Dawn_US_4_4_0_vivek_part_2_complex_queries.xlsx",
      sheetName: "Sheet1",
    }).then((rows) => {
      const queries = rows
        .map((r) =>
          Array.isArray(r)
            ? r[0]
            : r && typeof r === "object"
            ? r.Query ?? r.query ?? r.Question ?? r.question ?? Object.values(r)[0]
            : r
        )
        .map((q) => (q == null ? "" : String(q).trim()))
        .filter((q) => q.length > 0);

      const timings = [];
      const totalQueries = queries.length;

      cy.wrap(queries).each((query, i) => {
        const formattedQuery = query.replace(/\n/g, " ");

        // 4️⃣ Send query
        cy.get("textarea#myTextArea", { timeout: 60000 })
          .should("be.visible")
          .clear({ force: true })
          .type(formattedQuery, { delay: 50, force: true });

        cy.then(() => {
          const prevCount = Cypress.$(BOT_SELECTOR).length;
          const prevText =
            prevCount > 0 ? Cypress.$(BOT_SELECTOR).last().text().trim() : "";

          const sendAt = Date.now();
          const sendAtISO = new Date(sendAt).toISOString();

          cy.get(".chatbox_btn").click({ force: true });

          cy.get(BOT_SELECTOR, { timeout: 60000 })
            .should(($els) => {
              const newCount = $els.length;
              const lastText =
                newCount > 0 ? $els.last().text().trim() : "";

              const ok =
                prevCount === 0
                  ? newCount > 0
                  : newCount > prevCount || lastText !== prevText;

              expect(ok, "Bot message appeared or updated").to.be.true;
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
                `⏱ #${i + 1}: Δ=${ms} ms`
              );
            });
        });

        const progress = ((i + 1) / totalQueries) * 100;
        cy.log(`Progress: ${Math.round(progress)}%`);

        cy.wait(500);
      }).then(() => {
        // 5️⃣ Export results
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
                ).replace(/"/g, '""')}"`
            )
            .join("\n");
          return header + lines;
        };

        cy.writeFile("cypress/results/response.json", out);
        cy.writeFile("cypress/results/responses.csv", toCsv(timings));

        // 6️⃣ Generate HTML report
        cy.get("div.chatbox__messages", { timeout: 20000 }).then(
          ($container) => {
            const queriesList = [];
            const responsesList = [];
            asdas

            $container.find(USER_SELECTOR).each((i, el) => {
              queriesList.push(Cypress.$(el).text().trim());
            });

            $container.find(".btc_chat_card_bot_span_msg").each((i, el) => {
              let resp = Cypress.$(el).html().trim();

              resp = resp.replace(
                /(https?:\/\/[^\s<]+|[A-Za-z0-9_-]+\.pdf)/g,
                (match) =>
                  `<a href="${match}" target="_blank">${match}</a>`
              );

              responsesList.push(resp);
            });

            let html = `
              <html>
              <head>
              <meta charset="utf-8"/>
              <title>Chatbot Results</title>
              <style>
                body{font-family:system-ui;max-width:920px;margin:24px auto}
                .row{padding:12px 0;border-bottom:1px solid #eee}
                .q{font-weight:600}
                .resp{white-space:pre-wrap}
              </style>
              </head>
              <body>
              <h1>Chatbot Run – ${new Date().toISOString()}</h1>
            `;

            for (
              let i = 0;
              i < Math.max(queriesList.length, responsesList.length);
              i++
            ) {
              html += `
                <div class="row">
                  <p class="q">Query #${i + 1}: ${queriesList[i] || ""}</p>
                  <p class="resp"><strong>Response:</strong> ${
                    responsesList[i] || ""
                  }</p>
                </div>
              `;
            }

            html += "</body></html>";

            cy.writeFile("cypress/results/full_records.html", html);
          }
        );
      });
    });
  });
});
