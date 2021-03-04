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

function modalStopListeners() {
    $("#modalUserId").off("focusout");
    $("#modalUserEmail").off("focusout");
    $("#modalUserPwd").off("focusout");
    $("#modalUserPwd").off("keyup");
    $("#modalUserCpwd").off("keyup");
    $("#modalUserLockedInput").off("change");
    $("#modalChangePasswordInput").off("change");
    $("#modalSubmitButton").off("click");
}

function modalValidate() {
    let valid = modalPWordValidation("modalChangePasswordInput",
                                     "modalUserPwd",
                                     "modalUserCpwd");
    if (valid === true) {
        modalStopListeners();
        return true;
    }

    let userObject = getUser($('#modalOrigUserId').val());

    let modalObject = {
        "user_id": $('#modalUserId').val(),
        "email": $('#modalUserEmail').val(),
        "locked": $('#modalUserLockedInput').prop('checked'),
        "role": $('#modalUserRole').val()
    };

    let match = true;
    if ((userObject.user_id !== modalObject.user_id) ||
        (userObject.email !== modalObject.email) ||
        (userObject.locked !== modalObject.locked) ||
        (userObject.role !== modalObject.role)) {
        match = false;
    }

    if (match === false) {
        modalStopListeners();
        return true;
    }

    return false;
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

    $('#modalSubmitButton').on("click", function(e) {
        e.preventDefault();
        let validated = modalValidate();
        if (validated === true) {
            $('#editUserModal form')[0].submit();
        } else {
            if ($('section div.flashes')[0]) {
                $('section div.flashes h4').html('Nothing to Update');
            } else {
                $('section').html(
                    `<!--flash messages-->
                    <div class="row flashes">
                        <h4 class="light-blue lighten-4 center-align">
                            Nothing to Update
                        </h4>
                    </div>`
                );
            }
            $('#modalClose')[0].click();
        }
    });
}

function modalGetUserRoleIconClass() {
    let role = $('#modalUserRole').val();
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

// eslint-disable-next-line no-unused-vars
function modalOptionClick(obj) {
    modalClearUserRoleIcon();
    obj.parentElement.parentElement.
        nextElementSibling.firstElementChild.click();
    modalSetUserRoleIcon();
}

function modalSetInitialUserRoleSelectValue(role) {
    modalClearUserRoleIcon();
    let selector = '#modalUserRoleIcon ~ .select-wrapper ';
    selector += 'ul li.optgroup-option';
    Object.keys($(selector)).
        map((key) => $(selector)[key]).
        find((obj) => obj.innerText === role).
        click();
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