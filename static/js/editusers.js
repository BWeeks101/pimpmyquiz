/* global modalChangePasswordCollapsible, M, pWordValidation,
inputHelperLabel, getRole, getUser */

function modalPWordValidation(checkBox, pWordInput, pWordConfInput) {
    checkBox = "#" + checkBox;
    let result = false;
    if ($(checkBox).is(":checked")) {
        result = pWordValidation(pWordInput, pWordConfInput);
    }
    return result;
}

function modalUserLockedToggleIcon () {
    if ($("#modalUserLockedInput").is(":checked")) {
        $("#modalUserLockedIcon").removeClass("fa-unlock light-blue-text").
            addClass("fa-lock red-text");
        return;
    }
    $("#modalUserLockedIcon").removeClass("fa-lock red-text").
            addClass("fa-unlock light-blue-text");
}

function modalChangePasswordToggle () {
    let changePasswordCollapsible = M.Collapsible.
            getInstance(modalChangePasswordCollapsible);
    if ($("#modalChangePasswordInput").is(":checked")) {
        $("#modalUserPwd").prop("disabled", false);
        $("#modalUserCpwd").prop("disabled", false);
        changePasswordCollapsible.open();
        return;
    }
    $("#modalUserPwd").prop("disabled", true);
    $("#modalUserCpwd").prop("disabled", true);
    changePasswordCollapsible.close();
}

function modalCreateListeners() {
    $("#modalUserPwd").on("focusout", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        inputHelperLabel("modalUserPwd");
    });

    $("#modalUserPwd").on("keyup", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        inputHelperLabel("modalUserPwd");
    });

    $("#modalUserCpwd").on("keyup", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        inputHelperLabel("modalUserCpwd");
    });

    $("#modalUserLockedInput").on("change", function () {
        modalUserLockedToggleIcon();
    });

    $("#modalChangePasswordInput").on("change", function() {
        modalChangePasswordToggle();
    });

    $("#modalUserId").on("focusout", function () {
        inputHelperLabel("modalUserId");
    });

    $("#modalUserEmail").on("focusout", function () {
        inputHelperLabel("modalUserEmail");
    });
}

function modalStopListeners() {
    $("#modalUserId").off("focusout");
    $("#modalUserEmail").off("focusout");
    $("#modalUserPwd").off("focusout");
    $("#modalUserPwd").off("keyup");
    $("#modalUserCpwd").off("keyup");
    $("#modalUserLockedInput").off("change");
    $("#modalChangePasswordInput").off("change");
}

function modalGetUserRoleIconClass() {
    let role = $('#modalUserRole')[0].value;
    return getRole(role).role_icon;
}

function modalSetUserRoleIcon() {
    let iconClass = modalGetUserRoleIconClass();
    $('#modalUserRoleIcon').addClass(iconClass);
}

function modalClearUserRoleIcon() {
    let iconClass = modalGetUserRoleIconClass();
    $('#modalUserRoleIcon').removeClass(iconClass);
}

function modalSetInitialUserRoleSelectValue(role) {
    modalClearUserRoleIcon();
    let options = document.querySelectorAll(
        '#modalUserRoleIcon ~ .select-wrapper ul li.optgroup-option');
    options.forEach(function (option) {
        if (option.innerText === role) {
            option.click();
            return true;
        }
    });
    modalSetUserRoleIcon();
}

// eslint-disable-next-line no-unused-vars
function modalPop(userId) {
    let user = getUser(userId);
    //$('#modalTitle').html(user.user_id);
    $('#modalUserLockedInput')[0].checked = user.locked;
    modalUserLockedToggleIcon();
    $('#modalOrigUserId').val(user.user_id);
    $('#modalUserEmail').val(user.email);
    $('#modalUserEmail ~ label').addClass("active");
    $('#modalUserId').val(user.user_id);
    $('#modalUserId ~ label').addClass("active");
    modalSetInitialUserRoleSelectValue(user.role);

    modalCreateListeners();
}

// eslint-disable-next-line no-unused-vars
function modalOptionClick(obj) {
    modalClearUserRoleIcon();
    obj.parentElement.parentElement.
        nextElementSibling.firstElementChild.click();
    modalSetUserRoleIcon();
}

// eslint-disable-next-line no-unused-vars
function modalValidate() {
    let valid = modalPWordValidation("modalChangePasswordInput",
                                     "modalUserPwd",
                                     "modalUserCpwd");
    if (valid === true) {
        modalStopListeners();
        return true;
    }

    let userObject = getUser($('#modalOrigUserId')[0].value);

    let modalObject = {
        "user_id": $('#modalUserId')[0].value,
        "email": $('#modalUserEmail')[0].value,
        "locked": $('#modalUserLockedInput')[0].checked,
        "role": $('#modalUserRole')[0].value
    };

    let match = true;
    if (userObject.user_id !== modalObject.user_id) {
        match = false;
    } else if (userObject.email !== modalObject.email) {
        match = false;
    } else if (userObject.locked !== modalObject.locked) {
        match = false;
    } else if (userObject.role !== modalObject.role) {
        match = false;
    }

    if (match === false) {
        modalStopListeners();
        return true;
    }

    return false;
}

$('#modalSubmitButton')[0].addEventListener("click", function(e) {
    e.preventDefault();
    let validated = modalValidate();
    if (validated === true) {
        $('#editUserModal form')[0].submit();
    } else {
        $('#modalClose')[0].click();
    }
});