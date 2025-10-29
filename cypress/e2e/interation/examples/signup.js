export function signup(useremail, userconfirmPassword, username, userlastName, userphone, userpassword) {
    cy.get('.rm_input_field').eq(0).clear().type(String(username));
    cy.get('.rm_input_field').eq(1).clear().type(String(userlastName));
    cy.get('.rm_input_field').eq(2).clear().type(String(useremail));
    cy.get('.rm_input_field').eq(3).clear().type(String(userpassword));
    cy.get('.rm_input_field').eq(4).clear().type(String(userconfirmPassword));
    cy.get('.rm_input_field').eq(5).clear().type(String(userphone));
    cy.get('.rm_mck_field .multiselect-wrapper').first().click();
    cy.get('.multiselect-dropdown').contains('boat').click();
    cy.get('.rm_nw_regis_inner > label').click();
    cy.get('.moc_primary_btn').click();
    cy.log(useremail, userpassword, username, userlastName, userconfirmPassword, userphone);

}