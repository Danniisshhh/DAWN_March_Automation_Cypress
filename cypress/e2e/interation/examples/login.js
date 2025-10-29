export function loginWithEmail(email, password) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(email) && password) {
    cy.get('.rm_mck_field')
      .find('.rm_input_field')
      .first()
      .clear()
      .type(email);

    cy.get('.mtt-20 > .rm_input_field')
      .clear()
      .type(password);

    cy.get('.moc_primary_btn').click();
  } else {
    console.error("Invalid email or password");
  }
}