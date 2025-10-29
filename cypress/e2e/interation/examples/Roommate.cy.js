import { loginWithEmail } from './login';
import { signup } from './signup';


describe('My First Test Suite', function () {
    it('My FirstTest', function () {
        cy.visit("https://stage.oomm.life/flash");
        cy.get('.rm_st_bottom_btn').get('.theme_primary_btn').click();

        //-------------------Login-------------------------------------------
        const users = [
            { email: 'danishullah@bitcot.com', password: '123456' },
            { email: 'invalidemail', password: 'pass123' },
            { email: 'test@example.com', password: 'Bitcot@123' }
        ];

        //-----------SignUp-------------------------------------------
        const signupUsers = [
            {
                useremail: 'danishullah+koko@bitcot.com', userpassword: 'Bitcot@123', username: 'Danish', userlastName: 'Ullah',
                userconfirmPassword: 'Bitcot@123', userphone: '987456321'
            }
        ];

        users.forEach(user => {
            loginWithEmail(user.email, user.password);
            cy.get('.rm_mck_signuptext').find('a').contains('Sign up').click().then(() => {
            // If the button was clicked, call signup              
            signup(signupUsers[0].useremail, signupUsers[0].userconfirmPassword, signupUsers[0].username, signupUsers[0].userlastName, signupUsers[0].userphone, signupUsers[0].userpassword);
            cy.get('.multiselect-wrapper')
            });
        });
    });
});


