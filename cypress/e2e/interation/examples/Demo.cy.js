///    <refrence types="Cypress" />
describe('My First Test Suite', function()
{
    it('My FirstTest', function() {
        cy.visit("https://rahulshettyacademy.com/seleniumPractise/#/")
        cy.get('.search-keyword').type("ca")

        cy.wait(2000)

        //Selenium get hit URL inn browser, cypress get acts like findElement of selenium 
        cy.get('.product:visible').should('have.length', 4)
        cy.get('.product').should('have.length', 5)
        //Parent child chaining 
        cy.get('.products').find('.product').should('have.length',4) 

        // Each method
        //el is element 
        cy.get('.products').find('.product').each(($el, index, $list) =>  {
            cy.log($list)
            const textVeg = $el.find('h4.product-name').text()
            if(textVeg.includes('Capsicum'))
            {
             cy.wrap($el).find('button').click()
            }
        })

        const logo=cy.get('.brand').then(function(logoelement){
            cy.log(logoelement.text())
        })
        cy.log(logo.text)


     //  cy.get('.products').find('.product').eq(2).contains('ADD TO CART').click()
 }
 )
}
)   

