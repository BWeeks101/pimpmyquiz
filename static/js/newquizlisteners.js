/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global addRound, addQ, removeMulti, addMulti, removeRound,
removeQ, imgPreviewError, imgPreviewLoad, popChangeConfModal, closeToolTip,
inputValidation, quizFormValidation, M, validateCorrectCheckboxes */

/* Remove click listener from .subopt elements */
// eslint-disable-next-line no-unused-vars
function stopListeningToSelect() {
    let selector = ".select-container .select-wrapper ";
    selector += "ul li.optgroup span div.subopt";
    $(selector).off("click");
}

/* Removed click listeners from .rcontrols- elements */
// eslint-disable-next-line no-unused-vars
function stopListeningToRControls() {
    $('.rcontrols-remove').off("click");
    $('.rcontrols-add').off("click");
}

/* Add click listeners to .rcontrols- elements */
// eslint-disable-next-line no-unused-vars
function listenToRControls() {
    // Define the .rcontrols-remove click listener
    $('.rcontrols-remove').on("click", (e) => {
        e.stopPropagation(); // Prevent the default link click action
        closeToolTip(e.currentTarget); // Close the tooltip for this element
        removeRound(e.currentTarget); // call removeRound()
    });

    // Define the .rcontrols-add click listener
    $('.rcontrols-add').on("click", (e) => {
        e.stopPropagation(); // Prevent the default link click action
        closeToolTip(e.currentTarget); // Close the tooltip for this element
        addRound(e.currentTarget); // call addRound()
    });
}

/* Remove click listeners from .qcontrols- elements */
// eslint-disable-next-line no-unused-vars
function stopListeningToQControls() {
    $('.qcontrols-remove').off("click");
    $('.qcontrols-add').off("click");
}

/* Add click listeners to .qcontrols- elements */
// eslint-disable-next-line no-unused-vars
function listenToQControls() {
    // Define the .qcontrols-remove click listener
    $('.qcontrols-remove').on("click", (e) => {
        e.stopPropagation(); // Prevent the default link click action
        closeToolTip(e.currentTarget); // Close the tooltip for this element
        removeQ(e.currentTarget); // Call removeQ()
    });

    // Define the .qcontrols-add click listener
    $('.qcontrols-add').on("click", (e) => {
        e.stopPropagation(); // Prevent the default link click action
        closeToolTip(e.currentTarget); // Close the tooltip for this element
        addQ(e.currentTarget); // Call addQ()
    });
}

/* Remove click listeners from .multi-control- elements */
// eslint-disable-next-line no-unused-vars
function stopListeningToMultiControls() {
    $('a.multi-control-remove').off("click");
    $('a.multi-control-add').off("click");
}

/* Add click listeners to .multi-control- elements */
// eslint-disable-next-line no-unused-vars
function listenToMultiControls() {
    // define the .multi-control-remove click listener
    $('a.multi-control-remove').on("click", (e) => {
        e.stopPropagation(); // Prevent the default link click action
        closeToolTip(e.currentTarget); // Close the tooltip for this element
        removeMulti(e.currentTarget); // Call removeMulti()
    });

    // define the .multi-control-add click listener
    $('a.multi-control-add').on("click", (e) => {
        e.stopPropagation(); // Prevent the default link click action
        closeToolTip(e.currentTarget); // Close the tooltip for this element
        addMulti(e.currentTarget); // Call addMulti()
    });
}

/* Remove input listeners from inputs in the specified container */
/* Requires: */
/*  container: div element containing the inputs */
// eslint-disable-next-line no-unused-vars
function stopListeningToQuizInputs(container) {
    // Ignore checkbox inputs
    $(container).
        find('input:not([type="checkbox"])').
            off('input');
}

/* Add input listeners to inputs in the specified container */
/* Requires: */
/*  container: div element containing the inputs */
// eslint-disable-next-line no-unused-vars
function listenToQuizInputs(container) {
    // Ignore checkbox inputs
    // On input, call inputValidation()
    $(container).
        find('input:not([type="checkbox"])').
            on('input', (e) => inputValidation(e.currentTarget));
}

/* Remove MaterializeCSS Collapsible instances from helpers in the specified */
/* container */
/* Requires: */
/*  container: div element containing the helper collapsibles */
// eslint-disable-next-line no-unused-vars
function stopListeningToQuizInputHelpers(container) {
    // (i declaration required by jQuery .each)
    $(container).find('.collapsible.helper-collapsible').
        each((i, elem) => { // For each .helper-collapsible...
            // Get the MaterializeCSS instance for the element, and destroy it
            let instance = M.Collapsible.getInstance(elem);
            if (instance) {
                instance.destroy();
            }
        });
}

/* Initialise MaterializeCSS Collapsible instances for helpers in the */
/* specified container */
/* Requires: */
/*  container: div element containing the helper collapsibles */
// eslint-disable-next-line no-unused-vars
function listenToQuizInputHelpers(container) {
    // Initialise MaterializeCSS Collapsible instances for .helper-collapsibles
    $(container).find('.collapsible.helper-collapsible').
        collapsible();
}

/* Remove error/load listeners from specified element */
/* Requires: */
/*  elem: .image-preview>img element */
function stopListeningToImgPreview(elem) {
    $(elem).off("error");
    $(elem).off("load");
}

/* Add error/load listeners to specified element */
/* Requires: */
/*  elem: .image-preview>img element */
// eslint-disable-next-line no-unused-vars
function listenToImgPreview(elem) {
    stopListeningToImgPreview(elem); // Remove any existing error/load listeners

    // Add error listener.  On error call imgPreviewError()
    $(elem).on("error", () => imgPreviewError(elem,
        `Unable to preview Image.<br>Please check the URL.`));

    // Add load listener.  On load call imgPreviewLoad()
    $(elem).on("load", () => imgPreviewLoad(elem, $(elem).
            closest('.collapsible-body').
                width())
    );
}

/* Add click listener to #submitButton element */
// eslint-disable-next-line no-unused-vars
function listenToSubmitButton() {
    $('#submitButton').on("click", (e) => {
        e.preventDefault(); // Prevent the default submit button click action
        quizFormValidation(); // Call quizFormValidation()
    });
}

/* Add click listener to #cancelUrl element */
// eslint-disable-next-line no-unused-vars
function listenToCancelUrl() {
    $('#cancelUrl').on('click', (e) => {
        e.preventDefault(); // Prevent the default link click action
        let type = 'cn'; // set type to 'cn' (cancel new)
        if ($('#editQuiz').length) {
            // If this is a quiz edit, set type to 'ce' (cancel edit)
            type = 'ce';
        }
        // Populate and call the change confirmation modal
        popChangeConfModal(type, e.currentTarget);
    });
}

/* Remove change listener from .correct Checkbox elements within the */
/* specified container */
// eslint-disable-next-line no-unused-vars
function stopListeningToCorrectCheckboxes(container) {
    $(container).
        find('.correct[type="checkbox"]').
            off('change');
}

/* Add change listener to .correct Checkbox elements within the specified */
/* container */
// eslint-disable-next-line no-unused-vars
function listenToCorrectCheckboxes(container) {
    // On change, call validateCorrectCheckboxes()
    $(container).
        find('.correct[type="checkbox"]').
            on('change', (e) => validateCorrectCheckboxes(e.currentTarget));
}

/* Remove change listener from .quizMulti Checkbox elements */
// eslint-disable-next-line no-unused-vars
function stopListeningToCheckbox() {
    $('input[type="checkbox"].quizMulti').
        off("change");
}

/* Add change listener to .quizMulti Checkbox elements */
// eslint-disable-next-line no-unused-vars
function listenToCheckbox() {
    $('input[type="checkbox"].quizMulti').on('change', (e) => {
        let type = 'mc'; // set type to 'mc' (multiple choice)
        if (!$(e.currentTarget).prop('checked')) {
            // If the .quizMulti is checked, set type to 'sa' (single answer)
            type = 'sa';
        }
        // Populate and call the change confirmation modal
        popChangeConfModal(type, e.currentTarget);
    });
}