/* global pWordValidation, userList, roleList, M,
modalChangePasswordCollapsible */

function modalPWordValidation(checkBox, pWordInput, pWordConfInput) {
    checkBox = "#" + checkBox;
    let result = false;
    if ($(checkBox).is(":checked")) {
        result = pWordValidation(pWordInput, pWordConfInput);
    }
    return result;
}

// eslint-disable-next-line no-unused-vars
function createRoleArray(pyList) {
    console.log(pyList);
    let roleArr = [];
    pyList.forEach(function (obj) {
        roleArr.push({"role": obj.role,
            "role_icon": obj.role_icon.class});
    });
    return roleArr;
}

function getRole(roleId) {
    let result = false;
    roleList.forEach(function (role) {
        if (role.role === roleId) {
            result = {"role": role.role,
                "role_icon": role.role_icon};
            return true; //Stop iterating when we find the specified role
        }
    });
    return result;
}

// eslint-disable-next-line no-unused-vars
function createUserArray(pyList) {
    console.log(pyList);
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

function modalHelperLabel (elem) {
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

function modalUserLockedToggleIcon () {
    if ($("#modalUserLockedInput").is(":checked")) {
        $("#modalUserLockedIcon").removeClass("fa-unlock light-blue-text").
            addClass("fa-lock red-text");
        return;
    }
    $("#modalUserLockedIcon").removeClass("fa-lock red-text").
            addClass("fa-unlock light-blue-text");
}

function modalCreateListeners() {
    $("#modalUserPwd").on("focusout", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        modalHelperLabel("modalUserPwd");
    });

    $("#modalUserPwd").on("keyup", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        modalHelperLabel("modalUserPwd");
    });

    $("#modalUserCpwd").on("keyup", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        modalHelperLabel("modalUserCpwd");
    });

    $("#modalUserLockedInput").on("change", function () {
        modalUserLockedToggleIcon();
    });


    $("#modalChangePasswordInput").on("change", function() {
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
    });

    $("#modalUserId").on("focusout", function () {
        modalHelperLabel("modalUserId");
    });

    $("#modalUserEmail").on("focusout", function () {
        modalHelperLabel("modalUserEmail");
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
function popModal(userId) {
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
function optionClick(obj) {
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
    console.log(valid);
    if (valid === true) {
        modalStopListeners();
        return true;
    }
    return false;
}