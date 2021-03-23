/* global modalChangePasswordCollapsible, M, pWordValidation,
inputHelperLabel, getRole, getUser, addRecordPositions, xHttpRequest,
getCurrentRecord, getRecordPosition */

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
    $(".select-wrapper ul li.optgroup span div.subopt").off("click");
    $("#modalUserLockedInput").off("change");
    $("#modalChangePasswordInput").off("change");
    $("#modalUserPwd").off("focusout");
    $("#modalUserPwd").off("keyup");
    $("#modalUserCpwd").off("keyup");
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

function modalCreateListeners() {
    $("#modalUserId").on("focusout", () => inputHelperLabel("modalUserId"));

    $("#modalUserEmail").
        on("focusout", () => inputHelperLabel("modalUserEmail"));

    //modal user role select box
    $(".select-wrapper ul li.optgroup span div.subopt").on("click", (e) => {
        modalClearUserRoleIcon();
        e.currentTarget.parentElement.parentElement.
            nextElementSibling.firstElementChild.click();
        modalSetUserRoleIcon();
    });

    $("#modalUserLockedInput").on("change", () => modalUserLockedToggleIcon());

    $("#modalChangePasswordInput").
    on("change", () => modalChangePasswordToggle());

    $("#modalUserPwd").on("focusout", () => {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        inputHelperLabel("modalUserPwd");
    });

    $("#modalUserPwd").on("keyup", () => {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        inputHelperLabel("modalUserPwd");
    });

    $("#modalUserCpwd").on("keyup", () => {
        pWordValidation("modalUserPwd", "modalUserCpwd");
        inputHelperLabel("modalUserCpwd");
    });

    $('#modalSubmitButton').on("click", (e) => {
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
    $('#modalUserLockedInput').prop('checked', user.locked);
    modalUserLockedToggleIcon();
    $('#modalOrigUserId').val(user.user_id);
    $('#modalUserEmail').val(user.email);
    $('#modalUserEmail ~ label').addClass("active");
    $('#modalUserId').val(user.user_id);
    $('#modalUserId ~ label').addClass("active");
    modalSetInitialUserRoleSelectValue(user.role);

    modalCreateListeners();
}

function getUserSearchResults(self) {
    let value = self.parentElement.previousElementSibling.
         firstElementChild.querySelector('input').value;
    if (value === "" || value === undefined || value.len < 2) {
        return;
    }
    let request = {
        'type':
            'userSearch',
        'params': {
            'searchStr': value,
            'page': 1
        }
    };
    addRecordPositions({
        'userSearch': request.params.searchStr,
        'currentPage': 1
    });
    xHttpRequest(request, $('#userSearchResults')[0]);
}

function listenToUserRoleCollapsibleHeaders() {
    $(".collapsible-user-roles .collapsible-header[data-role]").
        on("click", (e) => {
            let self = e.currentTarget;
            let selector = ".collapsible .results-data";
            let target = self.nextElementSibling.querySelector(selector);
            let key;
            if (!self.parentElement.classList.contains("active")) {
                key = {'role': self.getAttribute("data-role")};
                getCurrentRecord(target, key);
            }
        });
}

function listenToUserSearchCollapsibleHeaders() {
    $(".collapsible-search .collapsible-header").on("click", (e) => {
        let self = e.currentTarget;
        let selector = ".collapsible .results-data";
        let target = self.nextElementSibling.querySelector(selector);
        let key = {'userSearch': getRecordPosition({'userSearch': ''}).
                        userSearch};
        if (key.userSearch) {
            if (!self.parentElement.classList.contains("active")) {
                getCurrentRecord(target, key);
            }
        }
    });
}

function userSearchCreateListeners() {
    $("#userSearch").on("focusout", () => inputHelperLabel("userSearch"));

    $("#userSearch").on("keyup", (e) => {
        if (e.key === "Enter") {
            inputHelperLabel("userSearch");
            getUserSearchResults($('#userSearch')[0].parentElement.
                parentElement.nextElementSibling.firstElementChild);
        }
    });

    $("#searchButton").
        on("click", () => getUserSearchResults($("#searchButton")[0]));
}

listenToUserRoleCollapsibleHeaders();
listenToUserSearchCollapsibleHeaders();
userSearchCreateListeners();