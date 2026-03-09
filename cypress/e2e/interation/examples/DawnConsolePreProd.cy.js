/// <reference types="cypress" />

/**
 * Cypress script for chatbot automation with:
 *  - Pre-injection of chatbotConfig
 *  - Pause before clicking Chat with Us (per lead’s feedback)
 *  - Token refresh handling
 *  - Result export (JSON, CSV, HTML)
 */

describe("Chatbot Automation - robust login + token refresh", () => {
    it("Dawn", () => {
        const BOT_SELECTOR =
            ".btc_chat_card_bot_span_msg, .chat-messages .assistant, .chat-messages .bot";
        const USER_SELECTOR = ".btc_chat_card_user";
        const CHAT_URL = "https://chat-myair.dawn-us-pre-prod.dht.live/";

        // 🔑 Your valid token (update before running)
        const INITIAL_TOKEN = "eyJraWQiOiJfTUpaT2FxdWpydXU5ZmF4V3hTX1FXU2tzSkJPUzVVY0RLaXZ0QWRnRXdNIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULmhseWk2ZFllb3QyVFQ1SmRHMV9jZEZGQ3VBZ2NGMHNPUnFSZzJSOUFyN1EiLCJpc3MiOiJodHRwczovL3Jlc21lZC1kaHQtdWF0Lm9rdGFwcmV2aWV3LmNvbS9vYXV0aDIvYXVzcmNrZGwyNUN6MzY1N2cxZDciLCJhdWQiOiJodHRwczovL2Rhd24ucmVzbWVkLmNvbS9hcGkiLCJpYXQiOjE3NzIwODQ0NzEsImV4cCI6MTc3MjA4NjI3MSwiY2lkIjoiMG9hcmNrNXlscGs2NVFpYXIxZDciLCJ1aWQiOiIwMHVycTBrMjIwalhGMUg0VzFkNyIsInNjcCI6WyJkYXduIl0sImF1dGhfdGltZSI6MTc3MjA4NDQ3MSwic3ViIjoibXlhaXIuajloYUB0YWFzLmRodC5saXZlIn0.bzztlVzgUOyKOVTjdcG5-CrP0J9FLWVrymr22Ok8-QufY292NlJpPsO1goiWaeO7FkPdrRv0mW1tyPbDVEX97bad5cXeige055dhbhxUeEXfsuijwEWhLYPIMbAFO4yiRnUwXas-fdYaA2GBnxFZaNG0ykwVL6Il1AX34BHFtMKnHJHk_xZX8Ijfrqr7usJ5zhHJVfvf8yNm40HdAxIupmcRYIjBMUWAoKiWdPwXhVHSj8bUHo3j99G4JLlZNZZTBfD201DN4emou_5r1-ClGxJD8m8jHk-X79cuTKCZBF1_Ke-EpF3FhQcfcmHrKYYwA3u0J5DKq6vopd-aqdOTYw";
        // 🧩 chatbotConfig object
        const chatbotConfig = {
            name: "Danish",
            email: "myair.j9ha@taas.dht.live",
            my_therapy_navigator_enabled: true,
            my_therapy_navigator_opt_out: false,
            access_token: INITIAL_TOKEN,
        };

        // 1️⃣ Visit & inject chatbotConfig before app JS loads
        cy.visit(CHAT_URL, {
            onBeforeLoad(win) {
                win.chatbotConfig = chatbotConfig;
                win.__test_helpers__ = {
                    getChatbotConfig: () => win.chatbotConfig,
                    setChatbotToken: (t) => {
                        win.chatbotConfig = Object.assign({}, win.chatbotConfig, {
                            access_token: t,
                        });
                        win.__test_helpers__.lastSetAt = new Date().toISOString();
                        return win.chatbotConfig;
                    },
                };
            },
        });

        // Wait for page assets to load
        cy.wait(6000);

        // 2️⃣ (Lead’s suggestion) — Pause before clicking chat button
        // This lets you manually verify chatbotConfig in console if needed
        cy.pause();

        // Reinforce injection right before clicking the button
        cy.window().then((win) => {
            win.chatbotConfig = chatbotConfig;
        });

        // 3️⃣ Click “Chat with us” button
        cy.get(".btn", { timeout: 20000 }).should("be.visible").click({ force: true });
        cy.wait(6000);

        cy.log("✅ ChatbotConfig injected and chat opened");

        // 4️⃣ Load Excel queries
        cy.task("readExcel", {
            filePath: "cypress/fixtures/updated_myAir_Dawn_US_4_4_0_vivek_part_2_complex_queries.xlsx",
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
            const startTime = Date.now();

            cy.wrap(queries).each((query, i) => {
                const formattedQuery = query.replace(/\n/g, " ");

                // 5️⃣ Check token lifetime (pause near expiry)
                cy.then(() => {
                    const elapsedMinutes = (Date.now() - startTime) / 60000;
                    if (elapsedMinutes >= 28) {
                        cy.log("⚠️ Token likely near expiry — pausing for refresh");
                        cy.pause();
                        // After pausing:
                        // 🟢 Option A: open browser console → window.chatbotConfig.access_token = "NEW_TOKEN";
                        // 🟢 Option B: in Cypress console → cy.window().then(win => win.__test_helpers__.setChatbotToken("NEW_TOKEN"));
                        // Then click “Resume”.
                    }
                });

                // 6️⃣ Send query
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
                            const lastText = newCount > 0 ? $els.last().text().trim() : "";

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
                                `⏱ #${i + 1}: sent=${sendAtISO}, firstChunk=${firstChunkISO}, Δ=${ms} ms`
                            );
                        });
                });

                const progress = ((i + 1) / totalQueries) * 100;
                cy.log(`Progress: ${Math.round(progress)}%`);
                cy.wait(500);
            }).then(() => {
                // 7️⃣ Export results
                const out = {
                    runAt: new Date().toISOString(),
                    count: timings.length,
                    items: timings,
                };

                const toCsv = (rows) => {
                    const header = "index,send_at,first_chunk_at,ms_to_first_chunk,query\n";
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

                // 8️⃣ Generate full HTML report
                cy.get("div.chatbox__messages", { timeout: 20000 }).then(($container) => {
                    const queriesList = [];
                    const responsesList = [];

                    $container.find(USER_SELECTOR).each((i, el) => {
                        queriesList.push(Cypress.$(el).text().trim());
                    });

                    $container.find(".btc_chat_card_bot_span_msg").each((i, el) => {
                        let resp = Cypress.$(el).html().trim();
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

                    for (
                        let i = 0;
                        i < Math.max(queriesList.length, responsesList.length);
                        i++
                    ) {
                        html += `<div class="row">`;
                        html += `<p class="q">Query #${i + 1}: ${queriesList[i] || ""}</p>`;
                        html += `<p class="resp"><strong>Response:</strong> ${responsesList[i] || ""
                            }</p>`;
                        html += `</div>`;
                    }

                    html += `</body></html>`;
                    cy.writeFile("cypress/results/full_records.html", html);
                });
            });
        });
    });
});
