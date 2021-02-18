function modalPWordValidation(checkBox, pWordInput, pWordConfInput) {
    checkBox = "#" + checkBox;
    let result = false;
    if ($(checkBox).is(":checked")) {
        result = pWordValidation(pWordInput, pWordConfInput);
    }
    return result;
}

function createUserArray(pyList) {
    let usrArr = [];
    pyList.forEach(function (obj) {
        usrArr.push({"user_id": obj.user_id,
            "email": obj.email,
            "locked": obj.locked});
    });
    return usrArr;
}

function getUser(user_id) {
    let result = false;
    userList.forEach(function (user) {
        if (user.user_id === user_id) {
            result = {"user_id": user.user_id,
                "email": user.email,
                "locked": user.locked};
            return true; //Stop iterating when we find the specified user
        }
    });
    return result;
}

function modalCreateListeners() {
    $("#modalUserPwd").on("focusout", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
    });

    $("#modalUserPwd").on("keyup", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
    });

    $("#modalUserCpwd").on("keyup", function () {
        pWordValidation("modalUserPwd", "modalUserCpwd");
    });

    $("#modalChangePasswordInput").on("change", function() {
        if ($("#modalChangePasswordInput").is(":checked")) {
            $("#modalUserPwd").prop("disabled", false);
            $("#modalUserCpwd").prop("disabled", false);
            return;
        }
        $("#modalUserPwd").prop("disabled", true);
        $("#modalUserCpwd").prop("disabled", true);
    });
}

function modalStopListeners() {
    $("#modalUserPwd").off("focusout");
    $("#modalUserPwd").off("keyup");
    $("#modalUserCpwd").off("keyup");
    $("#modalChangePasswordInput").off("change");
}

function popModal(user_id) {
    let user = getUser(user_id);
    console.log(user_id);
    console.log(user);
    $('#modalTitle').html(user.user_id);
    $('#modalUserLockedInput')[0].checked = user.locked;
    $('#modalOrigUserId').val(user.user_id);
    $('#modalUserEmail').val(user.email);
    $('#modalUserEmail ~ label').addClass("active");
    $('#modalUserId').val(user.user_id);
    $('#modalUserId ~ label').addClass("active");

    modalCreateListeners();
}

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