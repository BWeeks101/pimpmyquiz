/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global modalChangePasswordCollapsible, M, pWordValidation,
setInputLabel, getRole, getUser, addRecordPositions, xHttpRequest,
getCurrentRecord, getRecordPosition, observeResults, closeToolTip,
modalPwdHelperCollapsible, inputValidation, listenToUserId, userIdValidate */

/* Password validation for editUserModal */
/* Requires: */
/*  checkbox: change password checkbox element Id */
/*  pWordInput: Password input element Id */
/*  pWordConfInput: Password Confirmation input element Id */
function modalPWordValidation(checkBox, pWordInput, pWordConfInput) {
    // Declare result as false
    let result = false;
    // If checkbox is checked, validate the password inputs
    if ($(`#${checkBox}`).is(":checked")) {
        result = pWordValidation(pWordInput, pWordConfInput);
    }

    // return result
    return result;
}

/* Toggle the 'locked' icon when the user locked checkbox state changes */
function modalUserLockedToggleIcon () {
    // If the checkbox is checked...
    if ($("#modalUserLockedInput").is(":checked")) {
        // Replace the blue unlocked icon with a red locked icon, then return
        $("#modalUserLockedIcon").removeClass("fa-unlock light-blue-text").
            addClass("fa-lock red-text");
        return;
    }

    // Otherwise replace the red locked icon with a blue unlocked icon
    $("#modalUserLockedIcon").removeClass("fa-lock red-text").
            addClass("fa-unlock light-blue-text");
}

/* Show the password input elements when the change password checkbox is */
/* checked */
function modalChangePasswordExpand() {
    // Enable the password inputs
    $("#modalUserPwd").prop("disabled", false);
    $("#modalUserCpwd").prop("disabled", false);

    /* Get the MaterializeCSS collapsible instance for the password input */
    /* collapsible container, then open it */
    M.Collapsible.
            getInstance(modalChangePasswordCollapsible).
                open();
    // Wait for the collapsible to open, then scroll to the bottom of the modal
    setTimeout(() => {
        $('#editUserModal')[0].scrollTo({
            top: $('#editUserModal')[0].scrollHeight,
            behavior: 'smooth'
        });
    }, 300);
}

/* Hide the password input elements when the change password checkbox is */
/* unchecked */
function modalChangePasswordCollapse() {
    // Ensure the change password checkbox is unchecked
    if ($("#modalChangePasswordInput").is(":checked")) {
        $("#modalChangePasswordInput").prop('checked', '');
    }

    /* Get the MaterializeCSS collapsible instance for the password input */
    /* collapsible container, then close it */
    M.Collapsible.
            getInstance(modalChangePasswordCollapsible).
                close();

    $("#modalUserPwd").prop("disabled", true). // disable the password input
        val(''). // clear the value
            removeClass('valid'). // remove the valid class
                removeClass('invalid'); // remove the invalid class
    setInputLabel("modalUserPwd"); // reset the input label

    $("#modalUserCpwd").prop("disabled", true). // Disable the pword conf input
        val(''). // clear the value
            removeClass('valid'). // remove the valid class
                removeClass('invalid'); // remove the invalid class
    setInputLabel("modalUserCpwd"); // reset the input label

    // Call MaterializeCSS updateTextFields to reset label positions
    M.updateTextFields();

    // Get the MaterializeCSS Collapsible input helper instance, and close it
    M.Collapsible.
        getInstance(modalPwdHelperCollapsible).
            close();
}

/* Show/Hide password inputs when the change password checkbox checked state */
/* changes */
function modalChangePasswordToggle () {
    // If the checkbox is checked, show the password inputs and return
    if ($("#modalChangePasswordInput").is(":checked")) {
        modalChangePasswordExpand();
        return;
    }

    // Otherwise hide the password inputs
    modalChangePasswordCollapse();
}

/* Validate modal input values before submission */
function modalValidate() {
    // Get password validation result
    let valid = modalPWordValidation("modalChangePasswordInput",
                                     "modalUserPwd",
                                     "modalUserCpwd");

    // If password validation is true, return true
    if (valid === true) {
        return true;
    }

    // Get the userObject from the userList global array
    let userObject = getUser($('#modalOrigUserId').val());

    // Define a matching object from modal input values for comparison
    let modalObject = {
        "user_id": $('#modalUserId').val(),
        "email": $('#modalUserEmail').val(),
        "locked": $('#modalUserLockedInput').prop('checked'),
        "role": $('#modalUserRole').val()
    };

    // Define match as true
    let match = true;

    /* If any of the userObject property values do not match the matching */
    /* modalObject property value, then return false */
    if ((userObject.user_id !== modalObject.user_id) ||
        (userObject.email !== modalObject.email) ||
        (userObject.locked !== modalObject.locked) ||
        (userObject.role !== modalObject.role)) {
        match = false;
    }

    // If match is false then a property has changed, so return true
    if (match === false) {
        return true;
    }

    // Otherwise return false
    return false;
}

/* Get the icon class for the user role */
function modalGetUserRoleIconClass() {
    // Get the role text
    let role = $('#modalUserRole').val();

    // Return the icon class for the role from the roleList global array
    return getRole(role).role_icon;
}

/* Set the icon class for the user role */
function modalSetUserRoleIcon() {
    // Get the icon class
    let iconClass = modalGetUserRoleIconClass();

    // Add the icon class to the user role icon element
    $('#modalUserRoleIcon').addClass(iconClass);
}

/* Clear the icon class for the user role */
function modalClearUserRoleIcon() {
    // Get the icon class
    let iconClass = modalGetUserRoleIconClass();

    // Remove the icon class from the user role icon element
    $('#modalUserRoleIcon').removeClass(iconClass);
}

/* Add listeners to modal elements */
function modalCreateListeners() {
    // Add click listener to user role select box .subopt elements
    $(".select-wrapper ul li.optgroup span div.subopt").on("click", (e) => {
        modalClearUserRoleIcon(); // Clear the user role icon
        // Get the matching optgroup .option element and call the click event
        $(e.currentTarget).parent().
            parent().
                next().
                    find(':first-child').
                        click();
        modalSetUserRoleIcon(); // Set the user role icon
    });

    // Add change listener to user locked checkbox to toggle the icon
    $("#modalUserLockedInput").on("change", () => modalUserLockedToggleIcon());

    // Add change listener to change password checkbox to toggle pword inputs
    $("#modalChangePasswordInput").
        on("change", () => modalChangePasswordToggle());

    // Add click listener to submit button
    $('#modalSubmitButton').on("click", (e) => {
        // Prevent submission
        e.preventDefault();

        // validate the modal inputs
        let validated = modalValidate();

        // callback functions for userIdValidate() call
        const invalid = () => false;
        const valid = () => $('#editUserModal form')[0].submit();

        // If validate is true, validate the user Id and return
        if (validated === true) {

            /* Call userIdValidate() */
            /* On invalid, return.  On valid, submit the editUserModal form */
            userIdValidate(invalid, valid);
            return validated;
        }

        // Otherwise get the MaterializeCSS Modal instance and close the modal
        let instance = M.Modal.
            getInstance(document.querySelector('#editUserModal'));
        instance.close();

        // Simulate a flash message from the server
        // If a flash message exists, replace it
        if ($('#flashSection div.flashes').length) {
            $('#flashSection div.flashes h4').html('Nothing to Update');
            return;
        }

        // Otherwise create a new flash message
        $('#flashSection').html(
            `<!--flash messages-->
            <div class="row flashes">
                <h4 class="light-blue lighten-4 center-align">
                    Nothing to Update
                </h4>
            </div>`
        );
    });

    // Initialise input listener for modalUserId input element
    listenToUserId();
}

/* Set user role when populating editUserModal */
/* Requires: */
/*  role: user role name */
function modalSetInitialUserRoleSelectValue(role) {
    // Clear the user role icon
    modalClearUserRoleIcon();

    // Declare .optgroup-option selector string
    let selector = '#modalUserRoleIcon ~ .select-wrapper ul li.optgroup-option';

    /* Turn jQuery object into array, then find correct element based on role */
    /* name, and call the click event */
    Object.keys($(selector)).
        map((key) => $(selector)[key]).
            find((obj) => obj.innerText.toLowerCase() === role.toLowerCase()).
                click();

    // Set the user role icon
    modalSetUserRoleIcon();
}

/* Populate elements within the editUserModal */
/* Requires: */
/*  userId: username for user to be edited */
// eslint-disable-next-line no-unused-vars
function popEditUserModal(userId) {
    // Get user object from userList global array
    let user = getUser(userId);

    // Set the user locked checkbox state and icon to match user.locked
    $('#modalUserLockedInput').prop('checked', user.locked);
    modalUserLockedToggleIcon();

    // Populate the hidden original user id input with user.user_id
    $('#modalOrigUserId').val(user.user_id);

    // Populate the email input with user.email
    $('#modalUserEmail').val(user.email);

    // Reset the email label and helper elements then remove the valid class
    inputValidation($('#modalUserEmail'), true);
    $('#modalUserEmail').removeClass('valid');

    // Populate the userId input with user.user_id
    $('#modalUserId').val(user.user_id);

    /* Reset the userId label and helper elements then remove the valid class */
    /* NB: Call inputValidation() rather than userIdValidate().  No need to */
    /* validate against the server at this point */
    inputValidation($('#modalUserId'), true);
    $('#modalUserId').removeClass('valid');

    // Set the user role based on user.role
    modalSetInitialUserRoleSelectValue(user.role);

    // Hide the password input elements
    modalChangePasswordCollapse();
}

/* Submit a user search request */
function getUserSearchResults() {
    // Get the search string from the userSearch input
    let value = $('#userSearch').val();

    // If the search string is 0 length or undefined set it to the * wildcard
    if (value === "" || value === undefined || value.length < 1) {
        value = '*';
    }

    // Create an xHttp request object
    let request = {
        'type':
            'userSearch', // request type
        'params': {
            'searchStr': value, // Search string
            'page': 1 // Request the 1st page of results
        }
    };

    // Update the userSearchPositions global object
    addRecordPositions({
        'userSearch': request.params.searchStr,
        'currentPage': 1
    });

    // Call xHttpRequest() to return the search results
    xHttpRequest(request, $('#userSearchResults')[0]);
}

/* Refresh the current results page when expanding a user role collapsible */
function listenToUserRoleCollapsibleHeaders() {
    // Add a click listener to user role collapsible header elements
    $(".collapsible-user-roles .collapsible-header[data-role]").
        on("click", (e) => {
            // Get the .results-data container element
            let target = $(e.currentTarget).next().
                find('.collapsible .results-data')[0];

            /* Remove click listeners from .modal-trigger elements currently */
            /* within the results */
            $(target).find('.modal-trigger').
                off('click');

            // If the collapsible is expanded...
            if (!$(e.currentTarget).parent().
                    hasClass('active')) {
                // Call getCurrentRecord() to refresh the current results page
                getCurrentRecord(
                    target, {'role': $(e.currentTarget).attr('data-role')});
            }
        });
}

/* Refresh the current results page when expanding the userSearch collapsible */
function listenToUserSearchCollapsibleHeaders() {
    // Add a click listener to the userSearch collapsible header element
    $(".collapsible-search .collapsible-header").on("click", (e) => {
        // Get the .results-data container element
        let target = $(e.currentTarget).next().
                find('.collapsible .results-data')[0];

        /* Remove click listeners from .modal-trigger elements currently */
        /* within the results */
        $(target).find('.modal-trigger').
                off('click');

        // Define the key for userSearchPositions comparison
        let key = {'userSearch': getRecordPosition({'userSearch': ''}).
                        userSearch};

        // If a userSearchPosition is recorded for this key
        if (key.userSearch) {
            // If the collapsible is expanded...
            if (!$(e.currentTarget).parent().
                    hasClass('active')) {

                // Call getCurrentRecord() to refresh the current results page
                getCurrentRecord(target, key);
            }
        }
    });
}

/* Add observer to .results-data containers to initialise MaterializeCSS */
/* tooltip elements and .modal-trigger click listeners within results, when */
/* results are returned */
function initResultObservers() {

    /* Initialise MaterializeCSS Tooltip elements and .modal-trigger click */
    /* listeners */
    /* Requires: */
    /*  elem: .results-data container element */
    const observerAction = (elem) => {
        // Initialise MaterializeCSS Tooltips
        $(elem).find('.tooltipped').
            tooltip();

        // Add .modal-trigger click event listeners
        $(elem).find('.modal-trigger').
            on('click', (e) => {
                // When clicked, close the tooltip and open the editUserModal
                closeToolTip(e.currentTarget);
                popEditUserModal($(e.currentTarget).attr('data-user'));
            });
    };

    // For each .results-data container...
    // (i declaration required by jQuery .each)
    $('.results-data').each((i, elem) => {
        // Add observer with observeAction() called by the callback function
        observeResults($(elem)[0], () => {
            observerAction($(elem)[0]);
        });
    });
}

/* Add keyup, click listeners to userSearch input and searchButton */
function userSearchCreateListeners() {
    // Add keyup listener to userSearch to execute a search on Enter keypress
    $("#userSearch").on("keyup", (e) => {
        if (e.key === "Enter") {
            getUserSearchResults();
        }
    });

    // Add listener to searchButton to execute a search on click
    $("#searchButton").on("click", () => {
        getUserSearchResults();
    });
}

/* Document Ready Function */
$(function() {
    // Initialise MaterializeCSS Select and Modal instances
    $('select').formSelect();
    $('.modal').modal();

    // Initialise listeners for modal elements
    modalCreateListeners();

    // Initialise listeners for user role and search collapsible headers
    listenToUserRoleCollapsibleHeaders();
    listenToUserSearchCollapsibleHeaders();

    // Initialise listeners for userSearch input and searchButton elements
    userSearchCreateListeners();

    // Initialise observers for .results-data container elements
    initResultObservers();
});