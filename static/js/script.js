/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global roleList, userList, categoryList */

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
    let record = roleList.find((role) => role.role === roleId);

    if (record) {
        result = {"role": record.role,
            "member_count": record.member_count,
            "role_icon": record.role_icon};
    }

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
    let record = userList.find((user) => user.user_id === userId);

    if (record) {
        result = {"user_id": record.user_id,
            "email": record.email,
            "locked": record.locked,
            "group": record.group,
            "role": record.role};
    }

    return result;
}

// eslint-disable-next-line no-unused-vars
function createCategoryArray(pyList) {
    let categoryArr = [];
    pyList.forEach(function (obj) {
        categoryArr.push({"category": obj.category,
            "category_icon": obj.category_icon.class});
    });
    return categoryArr;
}

// eslint-disable-next-line no-unused-vars
function getCategory(catId) {
    let result = false;
    let record = categoryList.find((category) => category.category === catId);

    if (record) {
        result = {"category": record.category,
            "category_icon": record.category_icon};
    }

    return result;
}

// eslint-disable-next-line no-unused-vars
function inputHelperLabel (elem) {
    elem = "#" + elem;
    let label = `${elem} ~ label`;
    let labelText = $(label).data("default");
    let labelColor = '';
    if ($(elem).hasClass('invalid')) {
        labelText = $(label).data("error");
        labelColor = "#F44336";
    }
    $(label).html(labelText).
        css("color", labelColor);
}

function getCategoryIconClass(category) {
    return getCategory(category).category_icon;
}

function setSelectIcon(elem, value) {
    let iconClass = getCategoryIconClass(value);
    elem.addClass(iconClass);
}

function clearSelectIcon(elem, value) {
    let iconClass = getCategoryIconClass(value);
    elem.removeClass(iconClass);
}

// eslint-disable-next-line no-unused-vars
function setSelectValue(elem, value) {
    elem.each((i, el) => {
        let selectContainer = el.closest('.select-container');
        let selectIcon = $('i.prefix', selectContainer);
        clearSelectIcon(selectIcon, $(el).val());
        let selector = `.select-wrapper `;
        selector += 'ul li.optgroup-option';
        Object.keys($(selector, selectContainer)).
            map((key) => $(selector, selectContainer)[key]).
                find((obj) => obj.innerText === value).
                    click();
        setSelectIcon(selectIcon, value);
    });
}

//document ready
$(function() {
    $('.sidenav').sidenav({edge: "right"});
    $(".dropdown-trigger").dropdown();
    $('.collapsible').collapsible();
    $('select').formSelect();
    $('.modal').modal();
});