/* global pWordValidation */

/* Add submit listener to #register form */
function listenToRegisterFormSubmission() {
    $('#register').submit((e) => {
        e.preventDefault(); // Prevent the default link click action

        // If password validation returns true, then submit the form
        if (pWordValidation('pwd', 'cPwd') === true) {
            $('#register')[0].submit();
        }
    });
}

/* Document Ready Function */
$(function () {
    // Initialise form submit listener
    listenToRegisterFormSubmission();
});