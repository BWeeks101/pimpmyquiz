/* ============================================ */
/* Password Confirmation Code Modified From */
/* https://jsfiddle.net/SirusDoma/ayf832td/ */
/* By Sirus Doma */
/* https://jsfiddle.net/user/SirusDoma/fiddles/ */
/* ============================================ */
/* Validates a password confirmation input against a paired password input */
/* DO NOT: */
/*      assign the 'validate' class to the password confirmation input */
/* DO: */
/*      assign the 'required' attribute to the password confirmation input */
/* Call on: */
/*      password input focusout */
/*      password confirmation input keyup */
/*      form submission */
/* Requires: */
/*      pWordInput: Element Id of Password Input Element */
/*      pWordConfInput: Element Id of Password Confirmation Input Element */
/*      NB: pWordConfInput requires a helper-text element with */
/*          an element Id equivalent to pWordConfInput + "Hlp" */
/*      Eg: */
/*          if the confirmation input element Id is "confirmationInput" */
/*          Then the helper-text element Id should be "confirmationInputHlp" */
function pWordValidation(pWordInput, pWordConfInput) {
    pWordInput = "#" + pWordInput;
    pWordConfInput = "#" + pWordConfInput;
    let pWordConfHelper = pWordConfInput + "Hlp";
    let hlptxt = "Passwords do not match.";
    if (($(pWordInput).val() !== $(pWordConfInput).val()) ||
        $(pWordInput).hasClass("invalid") ||
        $(pWordInput).val().length === 0) {
        $(pWordConfInput).removeClass("valid").
        addClass("invalid");
        if ($(pWordInput).hasClass("invalid") ||
            $(pWordInput).val().length === 0) {
            hlptxt = "Invalid Password.";
        }
        $(pWordConfHelper).attr("data-error", hlptxt);
        return false;
    }
    $(pWordConfInput).removeClass("invalid").
    addClass("valid");
    $(pWordConfHelper).attr("data-error", "");
    return true;
}

function modalPWordValidation(checkBox, pWordInput, pWordConfInput) {
    checkBox = "#" + checkBox;
    let result = true;
    if ($(checkBox).is(":checked")) {
        result = pWordValidation(pWordInput, pWordConfInput);
    }
    return result;
}

$(document).ready(function() {
    $('.sidenav').sidenav({edge: "right"});
    $(".dropdown-trigger").dropdown();
    $('.collapsible').collapsible();
    $('.tooltipped').tooltip();
    $('.datepicker').datepicker({
        format: "dd mmmm, yyyy",
        yearRange: 3,
        showClearBtn: true,
        i18n: {
            done: "Select"
        }
    });
    $('select').formSelect();
    $('.modal').modal();

    function validateMaterializeSelect() {
        let classValid = {
            "border-bottom": "1px solid #4caf50",
            "box-shadow": "0 1px 0 0 #4caf50"
        };
        let classInvalid = {
            "border-bottom": "1px solid #f44336",
            "box-shadow": "0 1px 0 0 #f44336"
        };
        if ($("select.validate").prop("required")) {
            $("select.validate").css({
                "display": "block",
                "height": "0",
                "padding": "0",
                "width": "0",
                "position": "absolute"
            });
        }
        $(".select-wrapper input.select-dropdown").on("focusin", function () {
            $(this).parent(".select-wrapper").
            on("change", function () {
                if ($(this).children("ul").
                children("li.selected:not(.disabled)").
                on("click")) {
                    $(this).children("input").
                    css(classValid);
                }
            });
        }).
        on("click", function () {
            if ($(this).parent(".select-wrapper").
            children("ul").
            children("li.selected:not(.disabled)").
            css("background-color") === "rgba(0, 0, 0, 0.03)") {
                $(this).parent(".select-wrapper").
                children("input").
                css(classValid);
            } else {
                $(".select-wrapper input.select-dropdown").
                on("focusout", function () {
                    if ($(this).parent(".select-wrapper").
                    children("select").
                    prop("required")) {
                        if ($(this).
                        css("border-bottom") !== "1px solid rgb(76, 175, 80)") {
                            $(this).parent(".select-wrapper").
                            children("input").
                            css(classInvalid);
                        }
                    }
                });
            }
        });
    }
    validateMaterializeSelect();

    /* Password Confirmation Code Modified From */
    /* https://jsfiddle.net/SirusDoma/ayf832td/ */
    /* By Sirus Doma */
    /* https://jsfiddle.net/user/SirusDoma/fiddles/ */
    $("#pwd").on("focusout", function () {
        pWordValidation("pwd", "cPwd");
    });

    $("#pwd").on("keyup", function () {
        pWordValidation("pwd", "cPwd");
    });

    $("#cPwd").on("keyup", function () {
        pWordValidation("pwd", "cPwd");
    });
});