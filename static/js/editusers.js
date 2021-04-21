/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global modalChangePasswordCollapsible, M, pWordValidation,
setInputLabel, getRole, getUser, addRecordPositions, xHttpRequest,
getCurrentRecord, getRecordPosition, observeResults, closeToolTip,
modalPwdHelperCollapsible */

function modalPWordValidation(checkBox, pWordInput, pWordConfInput) {
    let result = false;
    if ($(`#${checkBox}`).is(":checked")) {
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

function modalChangePasswordExpand() {
    $("#modalUserPwd").prop("disabled", false);
    $("#modalUserCpwd").prop("disabled", false);
    M.Collapsible.
            getInstance(modalChangePasswordCollapsible).
                open();
    setTimeout(() => {
        $('#editUserModal')[0].scrollTo({
            top: $('#editUserModal')[0].scrollHeight,
            behavior: 'smooth'
        });
    }, 300);
}

function modalChangePasswordCollapse() {
    if ($("#modalChangePasswordInput").is(":checked")) {
        $("#modalChangePasswordInput").prop('checked', '');
    }
    M.Collapsible.
            getInstance(modalChangePasswordCollapsible).
                close();
    $("#modalUserPwd").prop("disabled", true).
        val('').
            removeClass('valid').
                removeClass('invalid');
    setInputLabel("modalUserPwd");
    $("#modalUserCpwd").prop("disabled", true).
        val('').
            removeClass('valid').
                removeClass('invalid');
    setInputLabel("modalUserCpwd");
    M.updateTextFields();
    M.Collapsible.
        getInstance(modalPwdHelperCollapsible).
            close();
}

function modalChangePasswordToggle () {
    if ($("#modalChangePasswordInput").is(":checked")) {
        modalChangePasswordExpand();
        return;
    }
    modalChangePasswordCollapse();
}

function modalValidate() {
    let valid = modalPWordValidation("modalChangePasswordInput",
                                     "modalUserPwd",
                                     "modalUserCpwd");
    if (valid === true) {
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
    //modal user role select box
    $(".select-wrapper ul li.optgroup span div.subopt").on("click", (e) => {
        modalClearUserRoleIcon();
        $(e.currentTarget).parent().
            parent().
                next().
                    find(':first-child').
                        click();
        modalSetUserRoleIcon();
    });

    $("#modalUserLockedInput").on("change", () => modalUserLockedToggleIcon());

    $("#modalChangePasswordInput").
        on("change", () => modalChangePasswordToggle());

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
function popEditUserModal(userId) {
    let user = getUser(userId);
    $('#modalUserLockedInput').prop('checked', user.locked);
    modalUserLockedToggleIcon();
    $('#modalOrigUserId').val(user.user_id);
    $('#modalUserEmail').val(user.email);
    $('#modalUserEmail ~ label').addClass("active");
    $('#modalUserId').val(user.user_id);
    $('#modalUserId ~ label').addClass("active");
    modalSetInitialUserRoleSelectValue(user.role);
    modalChangePasswordCollapse();
}

function getUserSearchResults() {
    let value = $('#userSearch').val();
    if (value === "" || value === undefined || value.length < 1) {
        value = '*';
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
            let target = $(self).next().
                find('.collapsible .results-data')[0];
            $(target).find('.modal-trigger').
                off('click');
            let key;
            if (!$(self).parent().
                    hasClass('active')) {
                key = {'role': $(self).attr('data-role')};
                getCurrentRecord(target, key);
            }
        });
}

function listenToUserSearchCollapsibleHeaders() {
    $(".collapsible-search .collapsible-header").on("click", (e) => {
        let self = e.currentTarget;
        let target = $(self).next().
                find('.collapsible .results-data')[0];
        $(target).find('.modal-trigger').
                off('click');
        let key = {'userSearch': getRecordPosition({'userSearch': ''}).
                        userSearch};
        if (key.userSearch) {
            if (!$(self).parent().
                    hasClass('active')) {
                getCurrentRecord(target, key);
            }
        }
    });
}

function initResultObservers() {
    const observerAction = (elem) => {
        $(elem).find('.tooltipped').
            tooltip();

        $(elem).find('.modal-trigger').
            off('click').
            on('click', (e) => {
                closeToolTip(e.currentTarget);
                popEditUserModal($(e.currentTarget).attr('data-user'));
            });
    };

    $('.results-data').each((i, elem) => {
        observeResults($(elem)[0], () => {
            observerAction($(elem)[0]);
        });
    });
}

function userSearchCreateListeners() {
    $("#userSearch").on("keyup", (e) => {
        if (e.key === "Enter") {
            getUserSearchResults();
        }
    });

    $("#searchButton").on("click", () => {
        getUserSearchResults();
    });
}

$(function() {
    $('select').formSelect();
    $('.modal').modal();
    modalCreateListeners();
    listenToUserRoleCollapsibleHeaders();
    listenToUserSearchCollapsibleHeaders();
    userSearchCreateListeners();
    initResultObservers();
});