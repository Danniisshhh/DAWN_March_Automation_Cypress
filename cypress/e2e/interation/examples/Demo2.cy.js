
describe("Automation_Practice", () => {
  it("pageOpen", () => {
    cy.visit("https://rahulshettyacademy.com/AutomationPractice/")
    cy.get("#checkBoxOption2").check().should("be.checked").and("have.value","option2")
    cy.get("#checkBoxOption1").check().should("be.checked").and("have.value","option1")
})
})