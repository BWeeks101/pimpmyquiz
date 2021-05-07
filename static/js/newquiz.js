/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global addObserver, stopObserver, stopListeningToSelect,
listenToSelect, returnHtml, stopListeningToMultiControls, listenToMultiControls,
stopListeningToQControls, listenToQControls, stopListeningToRControls, M,
listenToRControls, listenToImgPreview, setSelectValue,
listenToQuizTitle, listenToSubmitButton, listenToChangeConfModalButtons,
popChangeConfModal, initChangeConfModal, listenToCancelUrl, inputValidation,
quizTitleValidate, listenToQuizInputHelpers, listenToQuizInputs,
stopListeningToQuizInputHelpers, stopListeningToQuizInputs,
listenToCorrectCheckboxes, stopListeningToCorrectCheckboxes,
listenToCheckbox, stopListeningToCheckbox, getInputHelper, closeInputHelper,
openInputHelper, initFormValidationModal */

/* Reinitialise MaterializeCSS select box and associated event listeners */
/* when the select box is disabled/enabled */
/* Requires: */
/*  elem: Select Element (Object or jQuery Object) */
function reinitSelectOnDisabled(elem) {
    // (i declaration required by jQuery .each)
    $(elem).each((i, el) => {
        // observer callback function
        const observerFunc = () => {
            stopListeningToSelect();
            $(el).formSelect();
            listenToSelect();
        };

        // Create and start the observer
        addObserver(el, observerFunc).
            observe(el, {attributeFilter: ['disabled']});
    });
}

/* When a .correct checkbox is clicked, verify that at least one .correct */
/* checkbox within the .answers-container is checked/unchecked.  If all */
/* .correct checkboxes have the same state, then add the invalid class to all */
/* Requires: */
/*  elem: Checkbox Input Element (Object or jQuery Object) */
function validateCorrectCheckboxes(elem) {
    let container = $(elem).closest('.answers-container');
    let checked = $(container).find('.correct:checked');
    let unchecked = $(container).find('.correct:not(:checked)');

    /* If no checkboxes within the container are checked, OR, no checkboxes */
    /* within the container are unchecked, then remove valid class from all */
    /* and apply the invalid class to all */
    if (!$(checked).length || !$(unchecked).length) {
        $(container).find('.checkbox-container>label').
            removeClass('valid').
                addClass('invalid');
        return;
    }

    // Remove the valid and invalid classes from any unchecked checkboxes
    $(unchecked).parent().
        removeClass('valid').
            removeClass('invalid');

    // Remove the invalid class and add the valid class to any checked checkbox
    $(checked).parent().
        removeClass('invalid').
            addClass('valid');
}


/* Add an additional multiple choice option */
/* Requires: */
/*  elem: a.multi-control-add Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function addMulti(elem) {
    // Get the round Id
    let rId = parseInt($(elem).closest('.collapsible').
        closest('.collapsible-body').
            prev().
                attr('data-round'));

    // Get the answers container elem
    let answersContainer = $(elem).closest('.answers-container');

    /* Get the current number of multiple choice options in this container */
    /* and add 1 */
    let multiCount = parseInt($(answersContainer).prev().
        val()) + 1;

    // Get the prefix elem (this holds the multi-control elems)
    let prefix = $(elem).closest('.prefix');

    // Get the question Id
    let qId = parseInt(prefix.attr('data-question'));

    // Get the multiple choice option Id, and add 1
    let mId = parseInt(prefix.attr('data-multi')) + 1;

    // Clear multi-controls from the closest option
    prefix.html("");

    // Call return HTML to get the generated html for the new option
    let request = 'addMulti';
    let answerHtml = returnHtml({request, rId, qId, mId});

    // Turn off listeners on multiple choice controls
    stopListeningToMultiControls();

    // Append the returned HTML to the answers container
    answersContainer.append(answerHtml);

    // Add 1 to the total count of multiple choice options in this container
    $(answersContainer).prev().
        val(multiCount);

    // Reinitialise multiple choice control listeners
    listenToMultiControls();

    // Initialise listeners for new elements within the container
    let multiContainer = $(`#answer_${rId}_${qId}_${mId}`).
        closest('.multi-container');
    listenToQuizInputHelpers(multiContainer);
    listenToQuizInputs(multiContainer);
    listenToCorrectCheckboxes(multiContainer);

    // Revalidate .correct checkboxes in the answers container
    let checkbox = $(`#correct_${rId}_${qId}_${mId}`);
    validateCorrectCheckboxes($(checkbox)[0]);
}


/* Open the change confirmation modal, with the relevant message */
/* Requires: */
/*  elem: a.multi-control-remove Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function removeMulti(elem) {

    /* Call the change confirmation modal with a type of 'rm' */
    /* (Remove multiple choice option) */
    popChangeConfModal('rm', elem);
}

/* Remove a multiple choice option */
/* Called if the changeConfModal receives a positive response when called */
/* by the removeMulti() func */
/* Requires: */
/*  elem: a.multi-control-remove Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function removeMultiAction(elem) {
    // Get the round Id
    let rId = parseInt($(elem).closest('.collapsible').
        closest('.collapsible-body').
            prev().
                attr('data-round'));

    // Get the prefix elem
    let prefix = $(elem).closest('.prefix');

    // Get the question Id
    let qId = parseInt(prefix.attr('data-question'));

    // Get the multiple choice option Id of the previous option
    let mId = parseInt(prefix.attr('data-multi')) - 1;

    // Get the multiContainer to be removed
    let multiContainer = $(elem).closest('.multi-container');

    // Get the parent answers container
    let answersContainer = multiContainer.closest('.answers-container');

    // Get the current multiple choice option count, and remove 1
    let multiCount = parseInt($(answersContainer).prev().
        val()) - 1;

    // Get the previous option
    let prevMulti = $(`.prefix[data-multi="${mId}"]`, answersContainer);

    // Call returnHtml to get the HTML for the multiple choice control elems
    let request = 'multiControl';
    let controlHtml = returnHtml({request, mId});

    // Stop listeners on multi controls
    stopListeningToMultiControls();

    // Add multi controls to the previous option
    prevMulti.html(controlHtml);

    // Stop listeners on elems that will be removed
    stopListeningToQuizInputHelpers(multiContainer);
    stopListeningToQuizInputs(multiContainer);
    stopListeningToCorrectCheckboxes(multiContainer);

    // Remove the multiple choice option
    multiContainer.remove();

    // Update the total number of multiple choice options in this container
    $(answersContainer).prev().
        val(multiCount);

    // Reinitialise listeners for multi controls
    listenToMultiControls();

    // Revalidate .correct checkboxes
    let checkbox = $(`#correct_${rId}_${qId}_${mId}`);
    validateCorrectCheckboxes($(checkbox)[0]);
}

/* Toggle the question between regular and multiple choice */
/* Called if the changeConfModal receives a positive response  when called */
/* by the input[type="checkbox"].quizMulti change listener */
/* Requires: */
/*  elem: input[type="checkbox"].quizMulti Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function checkBoxMulti(elem) {
    // Get the round Id
    let rId = parseInt($(elem).closest('.collapsible').
        closest('.collapsible-body').
            prev().
                attr('data-round'));

    // Get required elems
    let inputField = $(elem).closest('.checkbox-container');
    let parentBody = inputField.closest('.collapsible-body');

    // Get questionTitle elem
    let questionTitle = parentBody.prev();

    // Get question Id
    let qId = parseInt(questionTitle.attr('data-question'));

    // Get the targetTitle and target answers container elems
    let targetTitle = inputField.next();
    let targetField = targetTitle.next().next();

    /* Check the state of the toggle checkbox and call returnHTML to get the */
    /* HTML for the answer/multiple choice elements */
    let request = 'toggleMulti';
    let checked = $(elem).prop('checked');
    let html = returnHtml({request, rId, qId, checked});

    // Stop listening to any controls and elements within the answers container
    stopListeningToMultiControls();
    stopListeningToQuizInputHelpers(targetField);
    stopListeningToQuizInputs(targetField);
    stopListeningToCorrectCheckboxes(targetField);

    // Alter the title html and the answers container html
    targetTitle.html(html.htmlTitle);
    targetField.html(html.htmlContent);

    /* Update the count of multiple choice options within the container */
    /* (This will be 0 if we have switched to a regular answer) */
    $(`#multiCount_${rId}_${qId}`).val(html.multiCount);

    // Reinitialise listeners for elems within the container
    listenToMultiControls();
    listenToQuizInputHelpers(targetField);
    listenToQuizInputs(targetField);
    listenToCorrectCheckboxes(targetField);
}

/* Add a new Question */
/* Requires: */
/*  elem: .qcontrols-add Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function addQ(elem) {
    // Get the round Id
    let rId = parseInt($(elem).closest('.collapsible-body').
        prev().
        attr('data-round'));

    // Get the current total number of questions in the round, and add 1
    let questionCount = parseInt($(`#questionCount_${rId}`).val()) + 1;

    // Get the question Id of the current question, and add 1
    let qId = parseInt($(elem).closest('.collapsible-header').
        attr('data-question')) + 1;

    // Get the collapsible elem for this round
    let target = $(elem).closest('ul.collapsible');

    // Get the div containing qControl elems for the closest question
    let qControls = $(elem).closest('div.qcontrols');

    // Call returnHtml to get the generated HTML for the new question
    let request = 'addQ';
    let html = returnHtml({request, rId, qId});

    // Disable listeners for .qControls and .quizMulti checkboxes
    stopListeningToQControls();
    stopListeningToCheckbox();

    // Remove .qControls from the closest question
    $(qControls).remove();

    // Append the new question HTML to the round collapsible
    $(target).append(html);

    // Update the question count value for the round
    $(`#questionCount_${rId}`).val(questionCount);

    // Reinitialise qControl and .quizMulti listeners
    listenToQControls();
    listenToCheckbox();

    // Initialise input and helper listeners for the new question
    let questionContainer = $(target).
        find(`.collapsible-header[data-question=${qId}]`).
            next();
    listenToQuizInputHelpers(questionContainer);
    listenToQuizInputs(questionContainer);

    /* Expand the collapsible containing the new question */
    /* Do this via adding the class and inline style to skip the animation */
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId}"]`).
            parent().
                addClass('active');
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId}"]`).
            next().
                css('display', 'block');

    // Scroll to the new question
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId}"]`)[0].
            scrollIntoView();
}

/* Open the change confirmation modal, with the relevant message */
/* Requires: */
/*  elem: .qcontrols-remove Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function removeQ(elem) {
    // Call the change confirmation modal with a type of 'rq' (Remove Question)
    popChangeConfModal('rq', elem);
}

/* Remove a question */
/* Called if the changeConfModal receives a positive response when called */
/* by the removeQ() func */
/* Requires: */
/*  elem: .qcontrols-remove Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function removeQAction(elem) {
    // Get round Id
    let rId = parseInt($(elem).closest('.collapsible-body').
        prev().
        attr('data-round'));

    // Get the current total number of questions in the round, and remove 1
    let questionCount = parseInt($(`#questionCount_${rId}`).val()) - 1;

    // Get the question Id, and remove 1
    let qId = parseInt($(elem).closest('.collapsible-header').
        attr('data-question')) - 1;

    // Get the li containing the question
    let target = $(elem).closest('li');

    // Get the previous question li
    let prevQ = $(target).prev();

    // Get the qControls container for the previous question
    let qControlsTarget = $(`#question_${rId}_${qId}`).
        closest('.collapsible-body').
            prev();

    // Call returnHtml to generate qControl HTML for the previous question
    let request = 'qControl';
    let qControlsHtml = returnHtml({request, qId});

    // Disable listeners on qControls and .quizMulti checkboxes
    stopListeningToQControls();
    stopListeningToCheckbox();

    /* Disable listeners for inputs, helpers and .correct checkboxes within */
    /* this question */
    let questionContainer = $(elem).closest('.collapsible-header').
        next();
    stopListeningToQuizInputHelpers(questionContainer);
    stopListeningToQuizInputs(questionContainer);
    stopListeningToCorrectCheckboxes(questionContainer);

    // Remove the question elems
    $(target).remove();

    // Update the question count for the round
    $(`#questionCount_${rId}`).val(questionCount);

    // Add qControls to the previous question
    $(qControlsTarget).append(qControlsHtml);

    // Reinitialise qControl and .quizMulti event listeners
    listenToQControls();
    listenToCheckbox();

    /* Expand the collapsible containing the previous question */
    /* Do this via adding the class and inline style to skip the animation */
    $(prevQ).addClass('active');
    $(prevQ).
        children(`.collapsible-header[data-question="${qId}"]`).
            next().
                css('display', 'block');

    // Scroll to the previous question
    $(prevQ).
        children(`.collapsible-header[data-question="${qId}"]`)[0].
            scrollIntoView();
}

/* Add a new Round */
/* Requires: */
/*  elem: .rcontrols-add Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function addRound(elem) {
    // Get the round Id of the current round, and add 1
    let rId = parseInt($(elem).closest('.collapsible-header').
        attr('data-round')) + 1;

    // Get the current total number of rounds in this quiz, and add 1
    let rCount = parseInt($('#roundCount').val()) + 1;

    // Get the collapsible elem for this round
    let target = $(elem).closest('ul.collapsible');

    // Get the div container rControl elems for the closest round
    let rControls = $(elem).closest('div.rcontrols');

    // Get the quiz category
    let quizCategory = $('#quizCategory').val();

    // Call returnHtml to generate HTML for the new round
    let request = 'addR';
    let html = returnHtml({request, rId});

    // Disable listeners for rControls, qControls and .quizMulti checkboxes
    stopListeningToRControls();
    stopListeningToQControls();
    stopListeningToCheckbox();

    // Remove rControls from the current Round
    $(rControls).remove();

    // Append the new round HTML to the rounds collapsible
    $(target).append(html);

    // Update the round count
    $('#roundCount').val(rCount);

    // Refresh MaterializeCSS text/url inputs (prevents overlapping labels)
    M.updateTextFields();

    // Initialise new MaterializeCSS collapsibles
    $('.collapsible.helper-collapsible').collapsible();
    $('.collapsible.expandable').collapsible({accordion: false});

    // Add input listener to the round title input
    $(`#roundTitle_${rId}`).
        on("input", (e) => inputValidation(e.currentTarget));

    // Reinitialise rControl, qControl and .quizMulti listeners
    listenToRControls();
    listenToQControls();
    listenToCheckbox();

    // Initialise input and helper listeners for the new ROund
    let roundContainer = $(target).
        find(`.collapsible-header[data-round=${rId}]`).
            next();
    listenToQuizInputHelpers(roundContainer);
    listenToQuizInputs(roundContainer);

    // Stop listening to select elems
    stopListeningToSelect();

    // Reinitialise select listeners
    $('select').formSelect();
    listenToSelect();

    // Set the category for the new round based on the quiz category
    setSelectValue($(`#roundCategory_${rId}`), quizCategory.toLowerCase());
    reinitSelectOnDisabled($(`#roundCategory_${rId}`));
    if (quizCategory.toLowerCase() !== 'general knowledge') {
        $(`#roundCategory_${rId}`).attr('disabled', true);
    }

    /* Expand the collapsible containing the new round */
    /* Do this via adding the class and inline style to skip the animation */
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId}"]`).
            parent().
                addClass('active');
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId}"]`).
            next().
                css('display', 'block');

    // Scroll to the new round
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId}"]`)[0].
            scrollIntoView();
}

/* Open the change confirmation modal, with the relevant message */
/* Requires: */
/*  elem: .rcontrols-remove Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function removeRound(elem) {
    // Call the change confirmation modal with a type of 'rr' (Remove Round)
    popChangeConfModal('rr', elem);
}

/* Remove a question */
/* Called if the changeConfModal receives a positive response when called */
/* by the removeRound() func */
/* Requires: */
/*  elem: .rcontrols-remove Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function removeRoundAction(elem) {
    // Get the round Id
    let rId = parseInt($(elem).closest('.collapsible-header').
        attr('data-round'));

    // Get the current total number of rounds, and remove 1
    let rCount = parseInt($('#roundCount').val()) - 1;

    // Get the round category select element
    let select = $(`#roundCategory_${rId}`)[0];

    // Reduce the round Id by 1
    rId -= 1;

    // Get the li containing the current round
    let target = $(elem).closest('li');

    // Get the li containing the previous round
    let prevR = $(target).prev();

    // Get the rControls container for the previous round
    let rControlsTarget = $('.collapsible-header[data-round]', prevR);

    // Call returnHtml to generate rControl HTML for the previous round
    let request = 'rControl';
    let rControlsHtml = returnHtml({request, rId});

    /* Disable listeners/observers for rControls, select, qControls */
    /* and .quizMulti checkboxes */
    stopListeningToRControls();
    stopListeningToSelect();
    stopObserver(select);
    stopListeningToQControls();
    stopListeningToCheckbox();

    // Disable input, helper, .correct checkbox listeners for the current round
    let roundContainer = $(elem).closest('.collapsible-header').
        next();
    stopListeningToQuizInputHelpers(roundContainer);
    stopListeningToQuizInputs(roundContainer);
    stopListeningToCorrectCheckboxes(roundContainer);

    // Remove the input listener from the round Title input elem for this round
    $(`#roundTitle_${rId}`).off('input');

    // Remove the round elems
    $(target).remove();

    // Update the round count for the quiz
    $('#roundCount').val(rCount);

    // Add rControls to the previous round
    $(rControlsTarget).append(rControlsHtml);

    /* Reinitialise listeners for rControls, select, qControls and */
    /* .quizMulti checkboxes */
    listenToRControls();
    $('select').formSelect();
    listenToSelect();
    listenToQControls();
    listenToCheckbox();

    /* Expand the collapsible containing the previous round */
    /* Do this via adding the class and inline style to skip the animation */
    $(prevR).addClass('active');
    $(prevR).
        children(`.collapsible-header[data-round="${rId}"]`).
            next().
                css('display', 'block');

    // Scroll to the previous round
    $(prevR).
        children(`.collapsible-header[data-round="${rId}"]`)[0].
            scrollIntoView();
}

/* Display a MaterializeCSS preloader */
/* Requires: */
/*  elem: .image-preview Element (Object or jQuery Object) */
function imgPreviewPreloader(elem) {
    let request = 'preloader';
    let html = returnHtml({request});
    $(elem).append(html);
}

/* Display a preloader, then display an image (or error) */
/* Requires: */
/*  imgUrl: URL to the image */
/*  target: .image-preview Element (Object or jQuery Object) */
// eslint-disable-next-line no-unused-vars
function imgPreview(imgUrl, target) {
    // If the imgUrl is 0 length, then clear the .image-preview html
    if (imgUrl.length === 0) {
        target.html('');
        return;
    }

    /* Call returnHtml to generate the .image-preview html */
    /* Adds a hidden img elem to the container */
    let request = 'imgPreview';
    $(target).html(returnHtml({request, imgUrl}));

    // Add error, load listeners to img elem within .image-preview container
    listenToImgPreview(target.children('img'));

    // Append a visible preloader to the .image-preview container
    imgPreviewPreloader(target);
}

/* Return the state of a trio of helpers expressed as a string of 3 single */
/* digit integers */
/* helper a, helper b, and a 3rd (p) combining the text from a and b */
/* p is a secondary collapsible elem added to helper a */
/* helper p is usually expanded when both input a and input b are invalid */
/* helper a and helper b relate to the primary helpers for a pair of inputs */
/* Requires: */
/*  helperCollapsibleA: helper Element (Object or jQuery Object) */
/*  helperCollapsibleB: helper Element (Object or jQuery Object) */
function getPairedHelperState(helperCollapsibleA, helperCollapsibleB) {
    // declare vars with a default value of 0 (collapsed)
    let a = 0;
    let b = 0;
    let p = 0;

    // helper a is expanded
    if ($(helperCollapsibleA).find('li:not(.paired)').
            hasClass('active')) {
        a = 1;
    }

    // helper b is expanded
    if ($(helperCollapsibleB).find('li').
            hasClass('active')) {
        b = 1;
    }

    // helper p is expanded
    if ($(helperCollapsibleA).find('li.paired').
            hasClass('active')) {
        p = 1;
    }

    // Return our 3 integers as a combined string
    return a.toString() + b.toString() + p.toString();
}

/* Return the validated state of a pair of inputs as a string of 2 integers */
/* Requires: */
/*  inputA: Text Input Element (Object or jQuery Object) */
/*  inputB: URL Input Element (Object or jQuery Object) */
function getPairedInputState(inputA, inputB) {
    // declare vars with a default value of -1 (not validated)
    let a = -1;
    let b = -1;

    // If inputA is valid, then a = 1, else if inputA is invalid then a = 0
    if ($(inputA).hasClass('valid') && !$(inputA).hasClass('invalid')) {
        a = 1;
    } else if ($(inputA).hasClass('invalid') && !$(inputA).hasClass('valid')) {
        a = 0;
    }

    // If inputB is valid, then b = 1, else if inputB is invalid then b = 0
    if ($(inputB).hasClass('valid') && !$(inputB).hasClass('invalid')) {
        b = 1;
    } else if ($(inputB).hasClass('invalid') && !$(inputB).hasClass('valid')) {
        b = 0;
    }

    // Return our pair of integers as a combined string
    return a.toString() + b.toString();
}

/* Open/Close Helpers based on state of paired inputs */
/* Requires: */
/*  newState: String representing the desired collapsed/expanded state of */
/*            the helpers */
/*  currentState: Object: */
/*                  state: String representing the existing */
/*                         collapsed/expanded state of the helpers */
/*                  a:  MaterializeCSS collapsible instance object */
/*                  b:  MaterializeCSS collapsible instance object */
function setHelperState(newState, currentState) {
    // if there is no change in state, return
    if (newState === currentState.state) {
        return;
    }

    switch (newState) {
    case '001':
        // helpers A + B should be closed, helper P should be open
        openInputHelper(currentState.a, 1);
        closeInputHelper(currentState.b);
        break;
    case '000':
        // helpers A + B + P should be closed
        closeInputHelper(currentState.a, 0);
        closeInputHelper(currentState.a, 1);
        closeInputHelper(currentState.b);
        break;
    case '100':
        // helpers B + P should be closed, helper A should be open
        openInputHelper(currentState.a, 0);
        closeInputHelper(currentState.b);
        break;
    case '010':
        // helpers A + P should be closed, helper B should be open
        closeInputHelper(currentState.a, 0);
        closeInputHelper(currentState.a, 1);
        openInputHelper(currentState.b);
        break;
    }
}

/* Translate the validation state of paired inputs into the desired */
/* expanded/collapsed state of our helpers */
/* Requires: */
/*  inputState: String representing the existing validation state of the */
/*              paired inputs */
/*  helperState: Object: */
/*                  state: String representing the existing */
/*                         collapsed/expanded state of the helpers */
/*                  a:  MaterializeCSS collapsible instance object */
/*                  b:  MaterializeCSS collapsible instance object */
function setPairedHelperState(inputState, helperState) {
    let newState;
    switch (inputState) {
    // Neither input is validated
    case '-1-1':
        // Close helpers A + B, open helper P
        newState = '001';
        break;
    // inputA is not validated, inputB is invalid
    case '-10':
        // Close helpers A + B, open helper P
        newState = '001';
        break;
    // inputA is not validated, inputB is valid
    case '-11':
        // Close helpers A + B + P
        newState = '000';
        break;
    // inputA is invalid, inputB is not validated
    case '0-1':
        // Close helpers A + B, open helper P
        newState = '001';
        break;
    // Both inputs are invalid
    case '00':
        // Close helpers A + B, open helper P
        newState = '001';
        break;
    // inputA is invalid, inputB is valid
    case '01':
        // Open helper A, close helpers B + P
        newState = '100';
        break;
    // inputA is valid, inputB is not validated
    case '1-1':
        // Close helpers A + B + P
        newState = '000';
        break;
    // inputA is invalid, inputB is invalid
    case '10':
        // Close helpers A + P, open helper B
        newState = '010';
        break;
    // Both inputs are valid
    case '11':
        // Close helpers A + B + P
        newState = '000';
        break;
    }

    // Set the helper states
    setHelperState(newState, helperState);
}

/* Validate pair of inputs */
/* Requires: */
/*  inputA: Text Input Element (Object or jQuery Object) */
/*  inputB: URL Input Element (Object or jQuery Object) */
function inputValidatePair (inputA, inputB) {
    // Get MaterializeCSS collapsible instances for the input helpers
    let helperA = getInputHelper(inputA);
    let helperB = getInputHelper(inputB);

    // Store the helper states and instances in an object
    let helperState = {
        'state': getPairedHelperState(helperA.el, helperB.el),
        'a': helperA,
        'b': helperB
    };

    // Get the validated state of the inputs
    let inputState = getPairedInputState(inputA, inputB);

    // Set the helper states
    setPairedHelperState(inputState, helperState);
}

/* Validate .img-url inputs, and call validation on paired text input */
/* Requires: */
/*  elem: .img-url Element (Object or jQuery Object) */
/*  skipInputValidation: (OPTIONAL) boolean (default = false). */
/*                      If True, paired input will not be validated */
// eslint-disable-next-line no-unused-vars
function checkImgUrl(elem, skipInputValidation = false) {
    // Get paired text input element
    let input = $(elem).parent().
            prev().
                prev();
    // Correct for multiple choice option elements
    if ($(elem).parent().
            hasClass('multi-input')) {
        input = $(input).prev();
    }
    input = $(input).children('input[type="text"]');

    // If no input is found, then return false
    if (!$(input).length) {
        return false;
    }


    if ($(elem).val().
            trim().length === 0) { // if .img-input has no value
        $(elem).removeClass("invalid").
            removeClass("valid"); // Remove valid/invalid classes

        $(input).prop('required', true); // ensure the input is required

        if (!skipInputValidation) {
            inputValidation(input, true); // Validate input
        }
        inputValidatePair(input, elem); // Validate input pair then return true
        return true;
    } else if ($(elem).hasClass('invalid')) { // if .img-input is invalid
        $(input).prop('required', true); // ensure the input is required

        if (!skipInputValidation) {
            inputValidation(input, true); // Validate input
        }
        inputValidatePair(input, elem); // Validate input pair then return true
        return true;
    }

    $(input).prop('required', false); // Ensure input is not required
    if ($(input).val().
            trim().length === 0) { // If input has no value
        $(input).removeClass('invalid').
            removeClass('valid'); // Remove valid/invalid classes
    }

    if (!skipInputValidation) {
        inputValidation(input, true); // validate input
    }
    inputValidatePair(input, elem); // Validate input pair then return true
    return true;
}

/* Create map of visible text, url, .correct & .quizMulti checkbox inputs */
/* within a form */
/* Requires: */
/*  form: Form Element (Object or jQuery Object) */
function buildValidationMap(form) {
    // Create CSS Selector and return inputs in a jQuery Object
    let selector = 'input:not(.hidden, .select-dropdown), ' +
        'div[data-round], div[data-question]';
    let inputs = $(form).find(selector);

    // Initialise variables
    let quiz = {'rounds': []};
    let i = 0;
    let roundElems = {};
    let questionElems = {};
    let answerElems = {};
    let optionElems = {};
    let breakRloop = false;
    let breakQloop = false;
    let breakOloop = false;

    /* Populate answerElems.options array property with optionElems objects */
    /* optionElems object properties: */
    /*  answer: .option text Input */
    /*  correct: .correct Checkbox Input */
    /*  oImg: .img-url url Input */
    /* Requires: */
    /*  i = Integer.  Index value for inputs jQuery Object */
    /*                Initial value should represent the position of a */
    /*                .option text Input element */
    const buildOptionElems = (i) => {

        /* Test elem object at position i and assign to optionElems property */
        /* Increments i and continues with PTC until a new round, question or */
        /* multiple choice option is detected */
        const scanOptions = (i) => {
            if ($(inputs[i]).hasClass('option') ||
                    $(inputs[i]).attr('data-question') ||
                        $(inputs[i]).attr('data-round')) {
                // New round/question/option detected, so break the option loop
                breakOloop = true;
            } else if ($(inputs[i]).hasClass('correct')) {
                // .correct Checkbox
                optionElems.correct = inputs[i];
            } else if ($(inputs[i]).hasClass('img-url') &&
                        $(inputs[i]).
                            closest('.multi-input').length) {
                // .img-url input
                optionElems.oImg = inputs[i];
            }

            if (breakOloop === false) { // No break detected, so increment i
                i += 1;
            }

            if (i > inputs.length - 1) { // Last object detect, so break
                breakOloop = true;
            }

            // If the options loop is broken...
            if (breakOloop === true) {
                // If no options property on the answerElems obj, create it
                if (!answerElems.options) {
                    answerElems.options = [];
                }

                /* Add the current optionElems obj to the answerElems.options */
                /* array property */
                answerElems.options.push(optionElems);
                optionElems = {}; // clear optionElems for reuse
                return i; // return the current inputs jQuery Object index
            }
            return scanOptions(i); // PTC
        };

        /* Elem at position i will be a .option text input so assign it as  */
        /* optionElems.answer */
        optionElems.answer = inputs[i];
        i += 1; // Increment the inputs jQuery Object index
        i = scanOptions(i); // Get the options inputs beginning at this index
        return i; // Return the current inputs jQuery Object index
    };

    /* Populate roundElems.questions array property with questionElems objs */
    /* questionElems object properties: */
    /*  header: .collapsible-header[data-question] Element */
    /*  question: .question text Input */
    /*  qImg: .img-url url Input */
    /*  quizMulti: .quizMulti Checkbox Input */
    /*  answer: Object with the following properties: */
    /*      EITHER: */
    /*          answer: .answer text Input */
    /*          aImg: .img-url url Input */
    /*      OR (Multiple Choice): */
    /*          options: Array of optionElems objs with the following props: */
    /*              answer: .option text Input */
    /*              correct: .correct Checkbox Input */
    /*              oImg: .img-url url Input */
    /* Requires: */
    /*  i = Integer.  Index value for inputs jQuery Object */
    /*                Initial value should represent the position of a */
    /*                .collapsible-header[data-question] element */
    const buildQuestionElems = (i) => {

        /* Test elem object at position i and assign to questionElems prop */
        /* Increments i and continues with PTC until a new round or question */
        /* is detected */
        const scanQuestions = (i) => {
            if ($(inputs[i]).attr('data-question') ||
                    $(inputs[i]).attr('data-round')) {
                // New round/question detected, so break the question loop
                breakQloop = true;
            } else if ($(inputs[i]).hasClass('question')) {
                // .question text input
                questionElems.question = inputs[i];
            } else if ($(inputs[i]).hasClass('img-url') &&
                    !$(inputs[i]).
                        closest('.answers-container').length) {
                // Question .img-url url input
                questionElems.qImg = inputs[i];
            } else if ($(inputs[i]).hasClass('quizMulti')) {
                // .quizMulti Checkbox
                questionElems.quizMulti = inputs[i];
            } else if ($(inputs[i]).hasClass('answer')) {
                // .answer text input
                answerElems.answer = inputs[i];
            } else if ($(inputs[i]).hasClass('img-url') &&
                    !$(inputs[i]).
                        closest('.multi-input').length &&
                    $(inputs[i]).
                        closest('.answers-container').length) {
                // Answer .img-url url input
                answerElems.aImg = inputs[i];
            } else if ($(inputs[i]).hasClass('option')) {
                // Multiple Choice Question, so call buildOptionElems()
                i = buildOptionElems(i);
            }

            // If the question and option loops are not broken, increment i
            if (breakQloop === false && breakOloop === false) {
                i += 1;
            }

            // If the option loop was broken, reset it
            if (breakOloop === true) {
                breakOloop = false;
            }

            /* If we have reached the end of the inputs array, break the */
            /* question loop */
            if (i > inputs.length - 1) {
                breakQloop = true;
            }

            // If the question loop is broken...
            if (breakQloop === true) {
                // Add the answerElems obj to the questionElems.answer property
                questionElems.answer = answerElems;
                answerElems = {}; // Clear answerElems for reuse

                /* Add the current questionElems obj to the */
                /* roundElems.questions array property */
                roundElems.questions.push(questionElems);
                questionElems = {}; // Clear questionElems for reuse
                return i; // return the current inputs jQuery Object index
            }
            return scanQuestions(i); // PTC
        };

        /* Elem at position i will be a .collapsible-header[data-question] */
        /* element, so assign it as questionElems.header */
        questionElems.header = inputs[i];
        i += 1; // Increment the inputs jQuery Object index
        // Get the question and answer/options inputs beginning at this index
        i = scanQuestions(i);
        return i; //Return the current inputs jQuery Object index
    };

    /* Populate quiz.rounds array property with roundElems objs */
    /* roundElems object properties: */
    /*  header: .collapsible-header[data-round] Element */
    /*  title: .round-title text Input */
    /*  header: .collapsible-header[data-question] Element */
    /*  questions: Array of questionElems objs with the following props: */
    /*      question: .question text Input */
    /*      qImg: .img-url url Input */
    /*      quizMulti: .quizMulti Checkbox Input */
    /*      answer: Object with the following properties: */
    /*          EITHER: */
    /*              answer: .answer text Input */
    /*              aImg: .img-url url Input */
    /*          OR (Multiple Choice): */
    /*              options: Array of optionElems objs with the following */
    /*                       props: */
    /*                  answer: .option text Input */
    /*                  correct: .correct Checkbox Input */
    /*                  oImg: .img-url url Input */
    /* Requires: */
    /*  i = Integer.  Index value for inputs jQuery Object */
    /*                Initial value should represent the position of a */
    /*                .collapsible-header[data-round] element */
    const buildRoundElems = (i) => {

        /* Test elem object at position i and assign to roundElems prop */
        /* Increments i and continues with PTC until a new round is detected */
        const scanRounds = (i) => {
            if ($(inputs[i]).attr('data-round')) {
                // New round detected, so break the round loop
                breakRloop = true;
            } else if ($(inputs[i]).hasClass('round-title')) {
                // .round-title text Input
                roundElems.title = inputs[i];
            } else if ($(inputs[i]).attr('data-question')) {
                // question header, so call buildQuestionElems()
                i = buildQuestionElems(i);
            }

            // If the round and question loops are not broken, increment i
            if (breakRloop === false && breakQloop === false) {
                i += 1;
            }

            // If the question loop was broken, reset it
            if (breakQloop === true) {
                breakQloop = false;
            }

            /* If we have reached the end of the inputs array, break the */
            /* round loop */
            if (i > inputs.length - 1) {
                breakRloop = true;
            }

            // If the round loop is broken...
            if (breakRloop === true) {
                // Add the roundElems obj to the quiz.rounds array property
                quiz.rounds.push(roundElems);
                roundElems = {}; // Clear roundElems for reuse
                return i; // return the current inputs jQuery Object index
            }

            return scanRounds(i); // PTC
        };

        /* Elem at position i will be a .collapsible-header[data-round] */
        /* element, so assign it as roundElems.header */
        roundElems.header = inputs[i];
        roundElems.questions = []; // Create the questions array property
        i += 1; // Increment the inputs jQuery Object index
        breakRloop = false; // Reset the round loop break boolean
        breakQloop = false; // Reset the question loop break boolean
        breakOloop = false; // Reset the option loop break boolean
        i = scanRounds(i); // Get the round inputs beginning at this index
        return i; // Return the current inputs jQuery Object Index
    };

    /* Populate quiz object */
    /* Requires: */
    /*  i = Integer.  Index value for inputs jQuery Object */
    const buildQuiz = (i) => {
        if ($(inputs[i]).attr('data-round')) {
            // round header, so call buildRoundElems()
            i = buildRoundElems(i);
            // If we have not reached the end of the inputs array...
            if (i < inputs.length - 1) {
                // continue from the new index position
                return buildQuiz(i); // PTC
            }
        }

        // If we have not reached the end of the inputs array...
        if (i < inputs.length - 1) {
            i += 1; // Increment the inputs jQuery Object index
            return buildQuiz(i); // PTC
        }
    };

    // Add the .quiz-title text Input to the quiz.title property
    quiz.title = $('.quiz-title')[0];
    // Call buildQuiz() to populate the quiz object
    buildQuiz(i);
    inputs = undefined; // Clear the inputs jQuery Object to free resources
    return quiz; // Return the quiz object
}

/* Validate inputs within a quiz form prior to form submission */
// eslint-disable-next-line no-unused-vars
function quizFormValidation() {

    // Set our form to #createQuizForm elem by default
    let quizForm = $('#createQuizForm')[0];
    if ($('#quizTitle').attr('data-id')) {
        // If this is a quiz edit, alter the form to the #editQuizForm elem
        quizForm = $('#editQuizForm')[0];
    }

    // Call buildValidationMap() to get our input elements for validation
    let validationMap = buildValidationMap($(quizForm));

    // Init variable for pending title validation interval
    let titleValidationPending;

    /* Create our validation object with the following properties: */
    /*  title: true, pending, or .quiz-title elem */
    /*  elems: Array of invalid input elements */
    let validationResults = {
        'title': true,
        'elems': [],
        'rounds': [],
        'roundIds': []
    };

    /* Update validationResults.title with .quiz-title validation state */
    /* Requires: */
    /*  titleInvalid: true/false boolean, or 'pending' string value */
    const titleValidation = (titleInvalid) => {
        if (titleInvalid === true) {

            /* title is invalid, so set validationResults.title to the */
            /* .quiz-title element */
            validationResults.title = validationMap.title;
            return;
        } else if (titleInvalid === false) {
            // title is valid, so set validationResults.title to true
            validationResults.title = true;
            return;
        }

        /* Neither true/false, so set validationResults.title to */
        /* titleInvalid value */
        validationResults.title = titleInvalid;
    };

    /* Test if an input element value is valid */
    /* Requires: */
    /*  elem: element object to test */
    const isInvalid = (elem) => {
        // .correct Checkbox
        if ($(elem).prop('type') === 'checkbox' &&
                    $(elem).hasClass('correct')) {
            // parent element (label) has the 'invalid' class
            if ($(elem).parent().
                    hasClass('invalid')) {
                // if ($(elem).prop('checked')) {
                //     return true;
                // }
                return true; // Return true
            }
            return false; // Otherwise return false
        }

        // Input has neither the valid/invalid classes, but is required
        if (!$(elem).hasClass('valid') &&
                !$(elem).hasClass('invalid') &&
                    $(elem).attr('required')) {
            // Add the invalid class
            $(elem).addClass('invalid');
            // If this is a .quiz-title elem
            if ($(elem).hasClass('quiz-title')) {
                // Create callback function calling titleValidation(isInvalid())
                const callback = () => {
                    titleValidation(isInvalid(validationMap.title));
                };

                /* Call quizTitleValidate(), executing our callback whether */
                /* the result is true or false, and overriding the usual */
                /* delay prior to submitting the xHttp request */
                quizTitleValidate(callback, callback, true);
                return 'pending'; // return 'pending' string value
            }

            /* Otherwise call inputValidation() for this elem, overriding the */
            /* usual delay prior to validation */
            inputValidation(elem, true);
        }

        // Input has the invalid class, so return true
        if ($(elem).hasClass('invalid')) {
            return true;
        }

        // Input is required, but has a value length of 0
        if ($(elem).attr('required') &&
                $(elem).val().
                    trim().length === 0) {
            // Remove the valid class (if it exists), and add the invalid class
            $(elem).removeClass('valid').
                addClass('invalid');

            /* Call inputValidation() for this elem, overriding the usual */
            /* delay prior to validation */
            /* (This ensures the helper is shown for this elem) */
            inputValidation(elem, true);
            return true; // Return true
        }

        // Input is required, and has a value length greater than 0
        if (!$(elem).attr('required') &&
                $(elem).val().
                    trim().length > 0) {

            // Input has a minlength and value length is less than minlength
            if ($(elem).attr('minlength') &&
                    $(elem).val().
                        trim().length < $(elem).attr('minlength')) {

                /* Remove the valid class (if it exists), and add the invalid */
                /* class */
                $(elem).removeClass('valid').
                    addClass('invalid');

                /* Call inputValidation() for this elem, overriding the usual */
                /* delay prior to validation */
                /* (This ensures the helper is shown for this elem) */
                inputValidation(elem, true);
                return true; // Return true
            }

            // Input has a maxlength and value length is greater than maxlength
            if ($(elem).attr('maxlength') &&
                    $(elem).val().
                        trim().length > $(elem).attr('maxlength')) {

                /* Remove the valid class (if it exists), and add the invalid */
                /* class */
                $(elem).removeClass('valid').
                    addClass('invalid');

                /* Call inputValidation() for this elem, overriding the usual */
                /* delay prior to validation */
                /* (This ensures the helper is shown for this elem) */
                inputValidation(elem, true);
                return true; // Return true
            }
        }

        return false; // elem is not invalid, so return false
    };

    // Validate the .quiz-title element
    titleValidation(isInvalid(validationMap.title));

    // Validate each round, question, answer and option input
    validationMap.rounds.forEach((round) => {
        // Initialise a roundData object that will hold validation data
        let roundData = {
            'id': undefined,
            'questions': []
        };

        // Get the roundId as a string
        let roundId = $(round.header).attr('data-round').
            toString();

        // If the .round-title input is invalid...
        if (isInvalid(round.title)) {
            // Add the elem to the validationResults.elems array property
            validationResults.elems.push(round.title);
            // The round is now invalid, so set roundData.id to the roundId str
            roundData.id = roundId;
        }

        // Validate each question, answer and option input
        round.questions.forEach((question) => {
            // Initialise boolean to track the validation state of the question
            let qValid = true;

            // If the .question input is invalid...
            if (isInvalid(question.question)) {
                // Add the elem to the validationResults.elems array property
                validationResults.elems.push(question.question);
                // The question is now invalid, so set qValid to false
                qValid = false;
            }

            // If the question .img-url input is invalid...
            if (isInvalid(question.qImg)) {
                // Add the elem to the validationResults.elems array property
                validationResults.elems.push(question.qImg);
                // The question is now invalid, so set qValid to false
                qValid = false;
            }

            // If this is a multiple choice question...
            if (question.answer.options) {

                /* call validateCorrectCheckboxes() against the first */
                /* .correct Checkbox Input for this question */
                validateCorrectCheckboxes($(question.answer.options[0].
                    correct));

                // Validate each option input
                question.answer.options.forEach((option) => {

                    // If the .option input is invalid...
                    if (isInvalid(option.answer)) {

                        /* Add the elem to the validationResults.elems */
                        /* array property */
                        validationResults.elems.push(option.answer);
                        // The question is now invalid, so set qValid to false
                        qValid = false;
                    }

                    // If the option .img-url input is invalid...
                    if (isInvalid(option.oImg)) {

                        /* Add the elem to the validationResults.elems */
                        /* array property */
                        validationResults.elems.push(option.oImg);
                        // The question is now invalid, so set qValid to false
                        qValid = false;
                    }

                    // If the .correct Checkbox is invalid...
                    if (isInvalid(option.correct)) {

                        /* Add the elem to the validationResults.elems */
                        /* array property */
                        validationResults.elems.push(option.correct);
                        // The question is now invalid, so set qValid to false
                        qValid = false;
                    }
                });

            } else { // Not multiple choice

                // If the .answer input is invalid...
                if (isInvalid(question.answer.answer)) {

                    /* Add the elem to the validationResults.elems */
                    /* array property */
                    validationResults.elems.push(question.answer.answer);
                    // The question is now invalid, so set qValid to false
                    qValid = false;
                }

                // If the answer .img-url input is invalid...
                if (isInvalid(question.answer.aImg)) {

                    /* Add the elem to the validationResults.elems */
                    /* array property */
                    validationResults.elems.push(question.answer.aImg);
                    // The question is now invalid, so set qValid to false
                    qValid = false;
                }
            }

            // If qValid is false, the question contains 1+ invalid inputs
            if (qValid === false) {
                // If roundData.id is not populated, set it to roundId
                if (!roundData.id) {
                    roundData.id = roundId;
                }

                /* Add the question id as a string to the roundData.questions */
                /* array property */
                roundData.questions.push(
                    $(question.header).attr('data-question').
                        toString());
            }
        });

        // If roundData.id is populated, the round contains 1+ invalid inputs
        if (roundData.id) {

            /* Add the roundData obj to the validationResults.rounds array */
            /* property */
            validationResults.rounds.push(roundData);

            /* Add the roundData.id to the validationResults.RoundIds array */
            /* property */
            validationResults.roundIds.push(roundData.id);
        }
    });

    /* Get the MaterializeCSS Collapsible instance */
    /* Requires: */
    /*  elem: An element with the .collapsible class */
    const getHeaderInstance = (elem) => M.Collapsible.getInstance(elem);

    /* Collapse Rounds and Questions that contain only valid inputs */
    const collapseValid = () => {
        validationResults.rounds.forEach((round) => {
            // Initialise variable
            let questionHeaderSelector;

            // If the round contains any invalid questions...
            if (round.questions) {

                /* Set the selector to match all question header elems within */
                /* this round */
                questionHeaderSelector = `.collapsible-header[data-round="` +
                    `${round.id}"]~.collapsible-body ` +
                        `.collapsible-header[data-question]`;
                // For each question...
                // (i declaration required by jQuery .each)
                $(questionHeaderSelector).each((i, elem) => {
                    // Get the MaterializeCSS Collapsible instance
                    let instance = getHeaderInstance(
                        $(elem).closest('.collapsible')[0]);

                    // Get the question Id as a string
                    let qId = $(elem).attr('data-question').
                        toString();

                    /* If the question Id does not exist in the */
                    /* round.questions array property, then it is valid */
                    if ($.inArray(qId, round.questions) === -1) {
                        // Collapse the question and return
                        instance.close(Number(qId) - 1);
                        return;
                    }

                    // Otherwise it is invalid, so expand the question
                    instance.open(Number(qId) - 1);
                });
            }
        });

        // For each round...
        // (i declaration required by jQuery .each)
        $('.collapsible-header[data-round]').each((i, elem) => {
            // Get the MaterializeCSS Collapsible instance
            let instance = getHeaderInstance(
                $(elem).closest('.collapsible')[0]);

            // Get the round Id as a string
            let rId = $(elem).attr('data-round').
                toString();

            /* If the round Id does not exist in the */
            /* validationResults.roundIds array property, then it is valid */
            if ($.inArray(rId, validationResults.roundIds) === -1) {

                /* Get the instance of each question collapsible within this */
                /* round */
                let qInstance = getHeaderInstance($(elem).next().
                    find('.collapsible-header[data-question]').
                        closest('.collapsible')[0]);
                qInstance.close(); // Collapse each question
                // Collapse the round and return
                instance.close(Number(rId) - 1);
                return;
            }

            // Otherwise it is invalid, so expand the round
            instance.open(Number(rId) - 1);
        });

    };

    /* Scroll to the first invalid input helper */
    const scrollToFirstInvalid = () => {
        // Initialise variables
        let elem;
        let helper;
        let helperSelectors = {
            'visible': '.helper-collapsible:visible',
            'active': '.helper-collapsible li.active'
        };

        // If the .quiz-title input is not valid, scroll to the visible helper
        if (validationResults.title !== true) {
            helper = $(validationResults.title).closest('.row').
                find(helperSelectors.visible);
        } else if (validationResults.elems) {

            /* Otherwise if there are invalid elems, get the first elem in */
            /* the array. */
            elem = $(validationResults.elems[0]);

            //  If the first elem is not a checkbox...
            if ($(elem).prop('type') !== 'checkbox') {
                if ($(elem).hasClass('round-title')) {
                    // .round-title input visible helper
                    helper = $(elem).closest('.round-row').
                        find(helperSelectors.visible);
                } else if ($(elem).hasClass('question')) {
                    // .question input .active helper
                    helper = $(elem).closest('.row').
                        find(helperSelectors.active);
                } else if ($(elem).hasClass('answer')) {
                    // .answer input .active helper
                    helper = $(elem).closest('.answers-container').
                        find(helperSelectors.active);
                } else if ($(elem).hasClass('option')) {
                    // .option input .active helper
                    helper = $(elem).closest('.multi-container').
                        find(helperSelectors.active);
                } else if ($(elem).hasClass('img-url')) {
                    // .img-url input .active helper
                    helper = $(elem).parent().
                        parent().
                            find(helperSelectors.active);
                }
            } else if ($(elem).hasClass('correct')) {
                // Otherwise if the first elem is a .correct Checkbox...
                // Get the title row above the .answers-container
                helper = $(elem).closest('.answers-container').
                    prev();
            }
        }

        // If we have populated the helper variable
        if (helper) {
            $(helper)[0].scrollIntoView(); // Scroll to the element
        }
    };

    /* Test validationResults object to determine if the quiz is validated */
    const quizIsValid = () => {

        /* If validationResults.title is true, and there are no entries in */
        /* the validationResults.elems, validationResults.rounds and */
        /* validationResults.roundIds array properties, then return true */
        if (validationResults.title === true &&
            !validationResults.elems.length &&
                !validationResults.rounds.length &&
                    !validationResults.roundIds.length) {
            return true;
        }
        return false; // Otherwise return false
    };

    /* Actions to take once validation test is complete */
    const validationActions = () => {
        // If the quiz is validated, submit the form and return
        if (quizIsValid()) {
            $(quizForm).submit();
            return;
        }

        // Otherwise...
        collapseValid(); // Collapse valid questions and rounds
        scrollToFirstInvalid(); // Scroll to the first invalid element helper
        // Display the form validation failure notification
        M.Modal.getInstance($('#formValidationModal')[0]).open();
    };

    /* If validationResults.title is 'pending' we are waiting on a response */
    /* from the quizTitleValidation() xhttp request */
    if (validationResults.title === 'pending') {

        /* Check the validationResults.title for a non-pending value */
        const checkTitle = () => {
            // If validationResults.title is no longer pending...
            if (validationResults.title !== 'pending') {
                // Clear the interval
                clearInterval(titleValidationPending);
                // If the value is true...
                if (validationResults.title !== true) {
                    // Wait for the helper to close and call validationActions()
                    setTimeout(() => {
                        validationActions();
                    }, 300);
                    return;
                }
                validationActions(); // Otherwise call validationActions() now
            }
        };

        /* Call a setInterval with checkTitle() as a callback to test */
        /* validationResults.title for a non-pending value every half a */
        /* second, then return */
        titleValidationPending = setInterval(checkTitle, 500);
        return;
    } else if (validationResults.title !== true) {
        // Otherwise if validationResults.title is true...
        // Wait for the helper to close and call validationActions()
        setTimeout(() => {
            validationActions();
        }, 300);
        return;
    }
    validationActions(); // Otherwise call validationActions() now
}

/* Document Ready Function */
$(function() {

    /* Initialise change confirmation and form validation modals */
    initChangeConfModal();
    initFormValidationModal();

    /* Initialise MaterializeCSS collapsibles */
    $('.collapsible.helper-collapsible').collapsible();
    $('.collapsible.expandable').collapsible({accordion: false});

    /* Initialise MaterializeCSS select boxes */
    $('select').formSelect();

    /* Initialise modal, cancel url, checkbox, and select box listeners */
    listenToChangeConfModalButtons();
    listenToCancelUrl();
    listenToCheckbox();
    listenToSelect();

    /* Set the initial value of the quiz and round category select boxes */
    setSelectValue($('#quizCategory'), 'general knowledge');
    setSelectValue($('#roundCategory_1'), 'general knowledge');

    /* Reinitialise round category select boxes to reflect disabled state */
    /* change, post setting initial value */
    reinitSelectOnDisabled($('.round-category'));

    /* Initialise round and question control, .quiz-title input and form */
    /* submit button listeners */
    listenToRControls();
    listenToQControls();
    listenToQuizTitle();
    listenToSubmitButton();
});