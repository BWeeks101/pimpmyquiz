/* global pWordValidation */

function listenToRegisterFormSubmission() {
    $('#register').submit((e) => {
        e.preventDefault();
        if (pWordValidation('pwd', 'cPwd') === true) {
            $('#register')[0].submit();
        }
    });
}

$(function () {
    listenToRegisterFormSubmission();
});