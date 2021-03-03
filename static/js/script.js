/* global roleList, userList */

/* ============================================ */
/* Password Confirmation Code Modified From */
/* https://jsfiddle.net/SirusDoma/ayf832td/ */
/* By Sirus Doma */
/* https://jsfiddle.net/user/SirusDoma/fiddles/ */
/* ============================================ */
/* Validates a password input against a paired password confirmation input */
/* DO NOT: */
/*      assign the 'validate' class to the password confirmation input */
/* DO: */
/*      assign the 'required' attribute to the password confirmation input */
/* Call on: */
/*      password input focusout */
/*      password input keyup */
/*      password confirmation input keyup */
/*      form submission */
/* Requires: */
/*      pWordInput: Element Id of Password Input Element */
/*      pWordConfInput: Element Id of Password Confirmation Input Element */
/*      NB: pWordConfInput requires an immediate next sibling label element */
// eslint-disable-next-line no-unused-vars
function pWordValidation(pWordInput, pWordConfInput) {
    pWordInput = "#" + pWordInput;
    pWordConfInput = "#" + pWordConfInput;
    let pWordConfHelper = pWordConfInput + "~ label";
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
    return true;
}

// eslint-disable-next-line no-unused-vars
function createRoleArray(pyList) {
    let roleArr = [];
    pyList.forEach(function (obj) {
        roleArr.push({"role": obj.role,
            "member_count": obj.member_count,
            "role_icon": obj.role_icon.class});
    });
    return roleArr;
}

// eslint-disable-next-line no-unused-vars
function getRole(roleId) {
    let result = false;
    roleList.forEach(function (role) {
        if (role.role === roleId) {
            result = {"role": role.role,
                "member_count": role.member_count,
                "role_icon": role.role_icon};
            return true; //Stop iterating when we find the specified role
        }
    });
    return result;
}

// eslint-disable-next-line no-unused-vars
function createUserArray(pyList) {
    let usrArr = [];
    pyList.forEach(function (obj) {
        usrArr.push({"user_id": obj.user_id,
            "email": obj.email,
            "locked": obj.locked,
            "group": obj.role_group,
            "role": obj.role});
    });
    return usrArr;
}

// eslint-disable-next-line no-unused-vars
function getUser(userId) {
    let result = false;
    userList.forEach(function (user) {
        if (user.user_id === userId) {
            result = {"user_id": user.user_id,
                "email": user.email,
                "locked": user.locked,
                "group": user.group,
                "role": user.role};
            return true; //Stop iterating when we find the specified user
        }
    });
    return result;
}

// eslint-disable-next-line no-unused-vars
function inputHelperLabel (elem) {
    elem = "#" + elem;
    let label = `${elem} ~ label`;
    let labelText = $(label).data("default");
    let labelColor = '';
    if ($(elem)[0].classList.contains('invalid')) {
        labelText = $(label).data("error");
        labelColor = "#F44336";
    }
    $(label).html(labelText).
        css("color", labelColor);
}

//document ready
$(function() {
    $('.sidenav').sidenav({edge: "right"});
    $(".dropdown-trigger").dropdown();
    $('.collapsible').collapsible();
    $('select').formSelect();
    $('.modal').modal();
});