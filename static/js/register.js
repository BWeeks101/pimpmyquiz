/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global pWordValidation, userIdValidate, listenToUserId */

/* Add submit listener to #register form */
function listenToRegisterFormSubmission() {
    $('#register').submit((e) => {
        e.preventDefault(); // Prevent the default link click action

        // callback functions for userIdValidate() call
        const invalid = () => false;
        const valid = () => {
            // If password validation returns true, then submit the form
            if (pWordValidation('pwd', 'cPwd') === true) {
                $('#register')[0].submit();
            }
        };

        /* Call userIdValidate() */
        /* On invalid, return.  On valid, submit the registration form */
        userIdValidate(invalid, valid);
    });
}

/* Document Ready Function */
$(function () {
    // Initialise input listener for user_id input
    listenToUserId();

    // Initialise form submit listener
    listenToRegisterFormSubmission();
});