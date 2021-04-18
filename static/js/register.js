/* global pWordValidation */

// eslint-disable-next-line no-unused-vars
function regValidate(funcResult) {
    if (funcResult === true) {
        $("#pwd, cPwd").off("input");
        return true;
    }
    return false;
}

$(function() {
    $("#pwd, #cPwd").on("input", function () {
        pWordValidation("pwd", "cPwd");
    });
});