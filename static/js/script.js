/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
// eslint-disable-next-line no-unused-vars
/* global observerList */
/* global xHttpRequest, M, checkBoxMulti,
removeQAction, removeRoundAction, deleteQuiz, checkImgUrl, imgPreview,
removeMultiAction */

/* Common Global Variables */
let observerList = [];
let validationTrackers = {};
let removeActionParams;
let roleList;
let userList;
let categoryList;

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
/*      password input elem input event */
/*      password confirmation input elem input event */
/*      form submission */
/* Requires: */
/*      pWordInput: Element Id of Password Input Element */
/*      pWordConfInput: Element Id of Password Confirmation Input Element */
/*      NB: pWordConfInput requires a label element */
// eslint-disable-next-line no-unused-vars
function pWordValidation(pWordInput, pWordConfInput) {
    // Prefix with # to create an id selector
    pWordInput = "#" + pWordInput;

    // Create label element selector
    let pWordConfLabel = `label[for="${pWordConfInput}"]`;

    // Prefix with # to create an id selector
    pWordConfInput = "#" + pWordConfInput;

    // Define default label text
    let labelText = "Passwords do not match.";

    // If passwords do not match, or the password is invalid, or is 0 length...
    if (($(pWordInput).val() !== $(pWordConfInput).val()) ||
            $(pWordInput).hasClass("invalid") ||
                $(pWordInput).val().length === 0) {
        // Make the confirmation input invalid
        $(pWordConfInput).removeClass("valid").
            addClass("invalid");

        // If the password is invalid, or is 0 length...
        if ($(pWordInput).hasClass("invalid") ||
                $(pWordInput).val().length === 0) {
            // Set the label text
            labelText = "Invalid Password.";
        }

        /* Update the confirmation input data-error attribute with the label */
        /* text, and return false (validation failed) */
        $(pWordConfLabel).attr("data-error", labelText);
        return false;
    }
    // Otherwise, the password is valid so make the confirmation input valid
    $(pWordConfInput).removeClass("invalid").
        addClass("valid");
    return true; // return true (validation passed)
}

/* Generate and return formatted html for DOM insertion */
/* Requires: */
/*  params: Object with the following parameters: */
/*      request: String. Type of html to return. Valid values: */
/*          toggleMulti */
/*          multiControl */
/*          addMulti */
/*          qControl */
/*          addQ */
/*          rControl */
/*          addR */
/*          preloader */
/*          imgPreview */
/*      Optional additional parameters: */
/*          rId: Number. Round Id */
/*          qId: Number. Question Id */
/*          mId: Number. Multiple choice option Id */
/*          checked: Boolean.  Checkbox value */
/*          init: Boolean.  True when initialising multiple choice options */
/*          imgUrl: String.  Url to an image. */
// eslint-disable-next-line no-unused-vars
function returnHtml(params) {

    /* Build multiple choice option controls */
    /* Requires: */
    /*  mId: Number. Multiple choice option Id */
    /*  init: OPTIONAL. Boolean. True when init multiple choice options */
    const buildMultiControlHtml = (mId, init) => {
        // If mId is NaN, return error.
        if (isNaN(mId)) {
            return 'Error: Missing/invalid mId';
        }

        // .multi-control-remove element
        let removeControlHtml = `
        <a href="#!" class="multi-control-remove light-blue-text ` +
            `text-darken-4">-</a>`;

        // .multi-control-add element
        let addControlHtml = `
        <a href="#!" class="multi-control-add light-blue-text ` +
            `text-darken-4">+</a>`;

        // Build the final html string
        let controlHtml = '';
        // if mId is 2, and init is not true...
        if (mId === 2 && !init) {
            controlHtml = addControlHtml; // add the addControlHtml
        } else if (mId > 2) { // Otherwise if mId > 2
            // add removeControlHtml + addControlHtml
            controlHtml = removeControlHtml + addControlHtml.trim();
        }

        return controlHtml; // return the finalised html string
    };

    /* Build multiple choice option elements */
    /* Requires: */
    /*  rId: Number. Round Id */
    /*  qId: Number. Question Id */
    /*  mId: Number. Multiple choice option Id */
    /*  init: OPTIONAL. Boolean. True when init multiple choice options */
    const buildMultiHtml = (rId, qId, mId, init) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId'; // rId is NaN so set err
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId'; // qId is NaN so update err
        }
        if (isNaN(mId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid mId'; // mId is NaN so update err
        }

        // If err length is > 0, return err
        if (err.length > 0) {
            return err;
        }

        // Call buildMultiControlHtml() to generate controls
        let controlHtml = buildMultiControlHtml(mId, init);

        // Define the multiple choice option html string
        let answerHtml = `
        <div class="multi-container col s12">
            <ul id="answerHelperCollapsible_${rId}_${qId}_${mId}" ` +
                    `class="collapsible helper-collapsible col s12">
                <li>
                    <div class="collapsible-header"></div>
                    <div class="collapsible-body">
                        <blockquote class="black-text">
                            An answer must be between 1-255 characters ` +
                                `in length.
                        </blockquote>
                    </div>
                </li>
                <li class="paired">
                    <div class="collapsible-header"></div>
                    <div class="collapsible-body">
                        <blockquote class="black-text">
                            Please provide an answer, and/or a valid link ` +
                            `to an image hosted online.<br>
                            An answer must be between 1-255 characters in ` +
                            `length.
                        </blockquote>
                    </div>
                </li>
            </ul>
            <div class="input-field multi-input col s10">
                <span class="prefix center-align" data-question="${qId}"` +
                    `data-multi="${mId}">
                    ${controlHtml}` +
                `</span>
                <input id="answer_${rId}_${qId}_${mId}" ` +
                    `name="answer_${rId}_${qId}_${mId}" ` +
                    `type="text" minlength="1" maxlength="255" ` +
                    `class="option" value="" required>
                <label for="answer_${rId}_${qId}_${mId}" ` +
                    `data-error="Invalid Answer" ` +
                    `data-default="Answer ${rId}-${qId}-${mId}">` +
                    `Answer ${rId}-${qId}-${mId}</label>
            </div>
            <div class="input-field col s2 checkbox-container ` +
                `inline-input center-align">
                <label class="center-align full-width">
                    <input id="correct_${rId}_${qId}_${mId}" ` +
                        `name="correct_${rId}_${qId}_${mId}" ` +
                        `class="correct"` +
                        `type="checkbox"/>
                    <span></span>
                </label>
            </div>
            <!-- Optional Image URL -->
            <ul id="aImgHelperCollapsible_${rId}_${qId}_${mId}" ` +
                    `class="collapsible helper-collapsible col s12">
                <li>
                    <div class="collapsible-header"></div>
                    <div class="collapsible-body">
                        <blockquote class="black-text">
                            Please provide a valid link to an image hosted ` +
                                `online
                        </blockquote>
                    </div>
                </li>
            </ul>
            <div class="input-field multi-input col s12">
                <span class="prefix light-blue-text text-darken-4 ` +
                    `center-align"></span>
                <input id="a_img_${rId}_${qId}_${mId}" ` +
                    `name="a_img_${rId}_${qId}_${mId}" ` +
                    `type="url" class="img-url" value="">
                <label for="a_img_${rId}_${qId}_${mId}" ` +
                    `data-error="Invalid URL" ` +
                    `data-default="Optional Image URL">` +
                    `Optional Image URL</label>
            </div>
            <div class="image-preview col s12 center-align"></div>
        </div>`;

        return answerHtml; // return the multiple choice option html string
    };

    /* Build answer elements */
    /* Requires: */
    /*  rId: Number. Round Id */
    /*  qId: Number. Question Id */
    const buildAHtml = (rId, qId) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId'; // rId is NaN so set err
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId'; // qId is NaN so update err
        }

        // If err length is > 0, return err
        if (err.length > 0) {
            return err;
        }

        // Define the answer html string
        let aHtml = `
                    <ul id="answerHelperCollapsible_${rId}_${qId}" ` +
                            `class="collapsible helper-collapsible col s12">
                        <li>
                            <div class="collapsible-header"></div>
                            <div class="collapsible-body">
                                <blockquote class="black-text">
                                    An answer must be between 1-255 ` +
                                        `characters in length.
                                </blockquote>
                            </div>
                        </li>
                        <li class="paired">
                            <div class="collapsible-header"></div>
                            <div class="collapsible-body">
                                <blockquote class="black-text">
                                    Please provide an answer, and/or a ` +
                                    `valid link to an image hosted ` +
                                    `online.<br>
                                    An answer must be between 1-255 ` +
                                    `characters in length.
                                </blockquote>
                            </div>
                        </li>
                    </ul>
                    <div class="input-field col s12">
                        <span class="prefix" data-question="${qId}" ` +
                            `data-multi="0"></span>
                        <input id="answer_${rId}_${qId}" ` +
                            `name="answer_${rId}_${qId}" ` +
                            `type="text" minlength="1" maxlength="255" ` +
                            `class="answer" value="" required>
                        <label for="answer_${rId}_${qId}" ` +
                                `data-error="Invalid Answer" ` +
                                `data-default="Answer ${qId}">` +
                                `Answer ${qId}</label>
                    </div>
                    <!-- Optional Image URL -->
                    <ul id="aImgHelperCollapsible_${rId}_${qId}" ` +
                            `class="collapsible helper-collapsible col s12">
                        <li>
                            <div class="collapsible-header"></div>
                            <div class="collapsible-body">
                                <blockquote class="black-text">
                                    Please provide a valid link to an ` +
                                        `image hosted online
                                </blockquote>
                            </div>
                        </li>
                    </ul>
                    <div class="input-field col s12">
                        <span class="prefix light-blue-text ` +
                            `text-darken-4 ` +
                            `center-align"></span>
                        <input id="a_img_${rId}_${qId}" ` +
                            `name="a_img_${rId}_${qId}" type="url" ` +
                            `class="img-url" value="">
                        <label for="a_img_${rId}_${qId}" ` +
                            `data-error="Invalid URL" ` +
                            `data-default="Optional Image URL"> ` +
                            `Optional Image URL</label>
                    </div>
                    <div class="image-preview col s12 center-align"></div>
                `;

        return aHtml; // return the answer html string
    };

    /* Return answer html, or initialise multiple choice options */
    /* Returned html depends on the status of the .quizMulti checkbox */
    /* Requires: */
    /*  rId: Number. Round Id */
    /*  qId: Number. Question Id */
    /*  checked: Boolean.  Checked state of .quizMulti checkbox */
    const toggleMultiHtml = (rId, qId, checked) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId'; // rId is NaN so set err
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId'; // qId is NaN so update err
        }
        if (typeof checked !== 'boolean' ||
            (checked !== true && checked !== false)) {
            if (err.length > 0) {
                err += `\n`;
            }
            // checked is invalid, so update err
            err += 'Error: Missing/invalid checked state';
        }

        // If err length is > 0, return err
        if (err.length > 0) {
            return err;
        }

        // Define mId as 0
        let mId = 0;

        // If checked is true...
        let htmlTitle = '';
        let htmlContent = '';
        if (checked === true) {
            // set mId = 1
            mId = 1;

            // Set htmlTitle for multiple choice options
            htmlTitle = `<span class="col s10">What are the Choices?</span>` +
                `<span class="col s2 center-align">Correct?</span>`;

            /* Initialise multiple choice options */
            /* Returns html for 3 multiple choice options */
            /* Controls are added to the third option */
            const initMultiHtml = () => {
                // Call buildMultiHtml() and append to htmlContent
                htmlContent += buildMultiHtml(rId, qId, mId, true); // init True
                // If mId < 3...
                if (mId < 3) {
                    mId += 1; // increment mId by 1
                    return initMultiHtml(); // PTC
                }
            };

            initMultiHtml(); // Initialise multiple choice options

            /* return an object with the html title, content and the number */
            /* of multiple choice options (either 0 or 3) */
            return {htmlTitle, htmlContent, 'multiCount': mId};
        }

        // Otherwise set htmlTitle for single answer
        htmlTitle = `<span class="col s12">What is the Answer?</span>`;

        // Call buildAHtml() to return the answer html string
        htmlContent = buildAHtml(rId, qId);

        /* return an object with the html title, content and the number */
        /* of multiple choice options (either 0 or 3) */
        return {htmlTitle, htmlContent, 'multiCount': mId};
    };

    /* Return question controls html */
    /* Requires: */
    /*  qId: Number. Question Id */
    const buildQControlHtml = (qId) => {
        // If qId is NaN, return error.
        if (isNaN(qId)) {
            return 'Error: Missing/invalid mId';
        }

        // .qcontrols container element
        let qControlHtml = `
                <div class="qcontrols col s2 right-align">
                    <a href="#!" ` +
                        `class="qcontrols-remove light-blue-text ` +
                            `text-darken-4">` +
                        `-</a>
                    <a href="#!" ` +
                        `class="qcontrols-add light-blue-text ` +
                            `text-darken-4">+</a>
                </div>`;

        // If qId is 1, update the .qcontrols container element string
        if (qId === 1) {
            qControlHtml = `
                <div class="qcontrols col s2 right-align">
                    <a href="#!" ` +
                        `class="qcontrols-add light-blue-text ` +
                            `text-darken-4">+</a>
                </div>`;
        }

        return qControlHtml; // return the finalised html string
    };

    /* Return question html */
    /* Requires: */
    /*  rId: Number. Round Id */
    /*  qId: Number. Question Id */
    const buildQHtml = (rId, qId) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId'; // rId is NaN so set err
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId'; // qId is NaN so update err
        }

        // If err length is > 0, return err
        if (err.length > 0) {
            return err;
        }

        // Call buildQControlHtml() to generate controls
        let qControlHtml = buildQControlHtml(qId);

        // Call builtAHtml() to generate the answer elements
        let aHtml = buildAHtml(rId, qId);

        // Define the question html string
        let qHtml = `
        <li>
            <div class="collapsible-header question-title" ` +
                `data-question="${qId}">
                Question ${qId}
                <svg class="caret" height="32" viewBox="0 0 24 24" ` +
                        `width="32" ` +
                        `xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5 5 5-5z"></path>
                    <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>` +
                qControlHtml + `
            </div>
            <div class="collapsible-body">
                <div class="row">
                    <!-- Question ${qId} -->
                    <ul id="questionHelperCollapsible_${rId}_${qId}" ` +
                        `class="collapsible helper-collapsible col s12">
                        <li>
                            <div class="collapsible-header"></div>
                            <div class="collapsible-body">
                                <blockquote class="black-text">
                                    A question must be between 2-255 ` +
                                        `characters in length.
                                </blockquote>
                            </div>
                        </li>
                        <li class="paired">
                            <div class="collapsible-header"></div>
                            <div class="collapsible-body">
                                <blockquote class="black-text">
                                    Please provide a question, and/or a ` +
                                    `valid link to an image hosted online.<br>
                                    A question must be between 2-255 ` +
                                    `characters in length.
                                </blockquote>
                            </div>
                        </li>
                    </ul>
                    <div class="input-field col s12">
                        <span class="prefix light-blue-text text-darken-4 ` +
                            `center-align"></span>
                        <input id="question_${rId}_${qId}" ` +
                            `name="question_${rId}_${qId}" ` +
                            `type="text" minlength="2" maxlength="255" ` +
                            `class="question" value="" required>
                        <label for="question_${rId}_${qId}" ` +
                            `data-error="Invalid Question" ` +
                            `data-default="Question ${qId}">` +
                            `Question ${qId}</label>
                    </div>
                    <!-- Optional Image URL -->
                    <ul id="qImgHelperCollapsible_${rId}_${qId}" ` +
                            `class="collapsible helper-collapsible col s12">
                        <li>
                            <div class="collapsible-header"></div>
                            <div class="collapsible-body">
                                <blockquote class="black-text">
                                    Please provide a valid link to an ` +
                                        `image hosted online
                                </blockquote>
                            </div>
                        </li>
                    </ul>
                    <div class="input-field col s12">
                        <span class="prefix light-blue-text text-darken-4 ` +
                            `center-align"></span>
                        <input id="q_img_${rId}_${qId}" ` +
                            `name="q_img_${rId}_${qId}" ` +
                            `type="url" class="img-url" value="">
                        <label for="q_img_${rId}_${qId}" ` +
                            `data-error="Invalid URL" ` +
                            `data-default="Optional Image URL">` +
                            `Optional Image URL</label>
                    </div>
                    <div class="image-preview col s12 center-align">
                    </div>
                    <!-- Multiple Choice? -->
                    <span class="title col s12">` +
                        `Is this a multiple choice Question?</span>
                    <div class="input-field col s12 checkbox-container">
                        <i class="prefix light-blue-text text-darken-4"></i>
                        <label id="quizMulti_${rId}_${qId}">
                            <input id="quizMultiInput_${rId}_${qId}" ` +
                                `class="quizMulti" ` +
                                `name="quizMulti_${rId}_${qId}" ` +
                                `type="checkbox"/>
                            <span>Multiple Choice?</span>
                        </label>
                    </div>
                    <!-- Answer -->
                    <div class="title col s12">
                        <span class="col s12">What is the Answer?</span>
                    </div>
                    <input id="multiCount_${rId}_${qId}" ` +
                        `name="multiCount_${rId}_${qId}" type="text" ` +
                        `class="hidden" value="1">
                    <div class="answers-container col s12">` +
                        aHtml +
                    `</div>
                </div>
            </div>
        </li>`;

        return qHtml; // Return the question html string
    };

    /* Return round controls html */
    /* Requires: */
    /*  rId: Number. Round Id */
    const buildRControlHtml = (rId) => {
        // If rId is NaN, return error.
        if (isNaN(rId)) {
            return 'Error: Missing/invalid rId';
        }

        // .rcontrols container element
        let rControlHtml = `
        <div class="rcontrols col s2 right-align">
            <a href="#!" ` +
                `class="rcontrols-remove light-blue-text ` +
                    `text-darken-4">` +
                `-</a>
            <a href="#!" ` +
                `class="rcontrols-add light-blue-text ` +
                `text-darken-4">` +
                `+</a>
        </div>`;

        // if rId is 1, update the .rcontrols container element string
        if (rId === 1) {
            rControlHtml = `
            <div class="rcontrols col s2 right-align">
                <a href="#!" ` +
                    `class="rcontrols-add light-blue-text ` +
                    `text-darken-4">` +
                    `+</a>
            </div>`;
        }

        return rControlHtml; // return the finalise html string
    };

    /* Build round html */
    /* Requires: */
    /*  rId: Number. Round Id */
    const buildRHtml = (rId) => {
        // If qId is NaN, return error.
        if (isNaN(rId)) {
            return 'Error: Missing/invalid rId';
        }

        // Call buildRControlHtml() to generate controls
        let rControlHtml = buildRControlHtml(rId);

        // Define the round html string
        let rHtml = `
            <li>
                <div class="collapsible-header round-title" data-round="${rId}">
                    Round ${rId}
                    <svg class="caret" height="32" viewBox="0 0 24 24" ` +
                            `width="32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 10l5 5 5-5z"></path>
                        <path d="M0 0h24v24H0z" fill="none"></path>
                    </svg>`;
        rHtml += rControlHtml +
                    `
                </div>
                <div class="collapsible-body">
                    <div class="row round-row">
                        <span class="title col xl12 hide-on-large-and-down">
                            Choose a Category and Provide a Title for this Round
                        </span>
                        <ul id="roundTitleHelperCollapsibleXl_${rId}" ` +
                            `class="collapsible helper-collapsible col ` +
                            `hide-on-large-and-down">
                            <li>
                                <div class="collapsible-header"></div>
                                <div class="collapsible-body">
                                    <blockquote class="black-text">
                                        Round titles must be 5-100 ` +
                                        `characters in length.
                                    </blockquote>
                                </div>
                            </li>
                        </ul>
                        <!-- Round Category -->
                        <span class="title col s12 hide-on-extra-large-only">
                            Choose a Category for this Round
                        </span>
                        <div class="input-field col s12 xl5 select-container">
                            <i id="roundCategoryIcon_${rId}" ` +
                                `class="prefix light-blue-text text-darken-4 ` +
                                `fas"></i>
                            <select id="roundCategory_${rId}" ` +
                                `class="round-category" ` +
                                `name="roundCategory_${rId}">`;
        // Iterate over categoryList global to generate round category select
        categoryList.forEach((category) => {
            rHtml += `
                                <optgroup label='<div class="subopt">
                                    <i class="fas ${category.category_icon} ` +
                                        `fa-fw light-blue-text ` +
                                        `text-darken-4">` +
                                        `</i> ` +
                                    `<span class="light-blue-text ` +
                                        `text-darken-4">
                                        ${category.category}
                                    </span></div>'>
                                    <option>${category.category}</option>
                                </optgroup>`;
        });
        rHtml += `
                            </select>
                            <label>Round Category</label>
                        </div>
                        <!-- Round Name -->
                        <span class="title col s12 hide-on-extra-large-only">
                            Provide a Title for this Round
                        </span>
                        <div class="col s12 xl7">
                            <ul id="roundTitleHelperCollapsible_${rId}" ` +
                            `class="collapsible helper-collapsible ` +
                            `hide-on-extra-large-only">
                                <li>
                                    <div class="collapsible-header"></div>
                                    <div class="collapsible-body">
                                        <blockquote class="black-text">
                                            Quiz titles must be 5-100 ` +
                                            `characters in length.
                                        </blockquote>
                                    </div>
                                </li>
                            </ul>
                            <div class="input-field">
                                <input id="roundTitle_${rId}" ` +
                                    `name="round_title_${rId}" type="text" ` +
                                    `minlength="5" maxlength="100" ` +
                                    `class="round-title" ` +
                                    `value="Round ${rId}" required>
                                <label for="roundTitle_${rId}" ` +
                                    `data-error="Invalid Round Title" ` +
                                    `data-default="Round Title">Round Title` +
                                    `</label>
                            </div>
                        </div>
                        <span class="title col s12">
                            Create Questions for this Round
                        </span>
                        <input id="questionCount_${rId}" ` +
                            `name="questionCount_${rId}" type="text" ` +
                            `class="hidden" value="1">
                    </div>
                    <div class="row">
                        <div class="col s12">
                            <ul class="collapsible expandable">
                                <li class="active">`;

        // Call buildQHtml() to generate question and answer elements
        let qHtml = buildQHtml(rId, 1);

        // Format the returned question html for inclusion in the round html
        qHtml = qHtml.slice(qHtml.indexOf("    <div"));
        let formatQHtml = qHtml.split("\n");
        qHtml = `
        `;
        formatQHtml.forEach((line, i) => {
            if (i === 0) {
                qHtml += `                        ` + line;
                return;
            }

            qHtml += `\n                        ` + line;

        });

        // Append the question html to the round html string
        rHtml += qHtml;

        // Finalise the round html string
        rHtml += `
                            </ul>
                        </div>
                    </div>
                </div>
            </li>
        `;

        return rHtml; // return the round html string
    };

    /* Build MaterializeCSS preloader */
    const preloader = () => {
        // Define preloader html string
        let preloaderHtml = `
        <div class="preloader-container">
            <div class="preloader-wrapper big active">
                <div class="spinner-layer">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                    </div>
                    <div class="gap-patch">
                        <div class="circle"></div>
                    </div>
                    <div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
        </div>`;

        return preloaderHtml; // return preloader html string
    };

    /* Build img element */
    /* Requires: */
    /*  imgUrl: String.  Url to an image. */
    const imgPreviewHtml = (imgUrl) => {
        // Define img html string
        let imgPreviewHtml = `<img class="hidden" src="${imgUrl}" ` +
                `alt="Image Preview"></img>`;

        return imgPreviewHtml; // return img html string
    };

    /* Validate params object and return requested html */
    const validateParams = () => {
        // If the request property is missing, return error
        if (!Object.prototype.hasOwnProperty.call(params, 'request')) {
            return 'Missing request parameter';
        }

        // Execute the relevant function to return the html string/object
        let html;
        switch (params.request) {
        case 'toggleMulti':
            html = toggleMultiHtml(params.rId, params.qId, params.checked);
            break;
        case 'multiControl':
            html = buildMultiControlHtml(params.mId); // returns an object
            break;
        case 'addMulti':
            html = buildMultiHtml(params.rId, params.qId, params.mId);
            break;
        case 'qControl':
            html = buildQControlHtml(params.qId);
            break;
        case 'addQ':
            html = buildQHtml(params.rId, params.qId);
            break;
        case 'rControl':
            html = buildRControlHtml(params.rId);
            break;
        case 'addR':
            html = buildRHtml(params.rId);
            break;
        case 'preloader':
            html = preloader();
            break;
        case 'imgPreview':
            html = imgPreviewHtml(params.imgUrl);
            break;
        default:
            break;
        }

        return html; // return the html string/object
    };

    // Call validateParams() to get the requested html string/object
    let result = validateParams();

    return result; // return the requested html string/object
}

/* Parse json user role list into roleList global array */
/* Requires: */
/*  jsonList: user role json list */
/* Inserts objects with the following properties: */
/*      role: Role name */
/*      member_count: Number of role members  */
/*      role_icon: Font Awesome icon class */
// eslint-disable-next-line no-unused-vars
function createRoleArray(jsonList) {
    // Redefine the global as an empty array
    roleList = [];

    // For each object in the list...
    jsonList.forEach(function (obj) {
        // Add an object to the global roleList array
        roleList.push({"role": obj.role, // role name
            "member_count": obj.member_count, // role members
            "role_icon": obj.role_icon.class}); // icon class
    });
}

/* Return role object from global roleList array */
/* Requires: */
/*  roleName: String representing the role name to locate */
/* Returns: */
/*  Object with the following properties: */
/*      role: Role name */
/*      member_count: Number of role members  */
/*      role_icon: Font Awesome icon class */
// eslint-disable-next-line no-unused-vars
function getRole(roleName) {
    // Locate a record within the global roleList array based on the role name
    let result = roleList.find(
        (role) => role.role.toLowerCase() === roleName.toLowerCase());

    // If no result is found, result is false
    if (!result) {
        result = false;
    }

    return result; // return the result
}

/* Parse user data list into userList global array */
/* Requires: */
/*  userData: user data list */
/* Inserts objects with the following properties: */
/*      user_id: User id */
/*      email: User email address  */
/*      locked: Boolean. Account locked status. */
/*      group: User role group membership */
/*      role: User role */
// eslint-disable-next-line no-unused-vars
function createUserArray(userData) {
    // Redefine the global as an empty array
    userList = [];

    // For each object in the list...
    userData.forEach(function (obj) {
        // Add an object to the global userList array
        userList.push({"user_id": obj.user_id, // User id
            "email": obj.email, // User email address
            "locked": obj.locked, // User account locked status
            "group": obj.role_group, // User role group membership
            "role": obj.role}); // User role
    });
}

/* Return user object from global userList array */
/* Requires: */
/*  userId: String representing the user id to locate */
/* Returns: */
/*  Object with the following properties: */
/*      user_id: User id */
/*      email: User email address  */
/*      locked: Boolean. Account locked status. */
/*      group: User role group membership */
/*      role: User role */
// eslint-disable-next-line no-unused-vars
function getUser(userId) {
    // Locate a record within the global roleList array based on the role name
    let result = userList.find(
        (user) => user.user_id.toLowerCase() === userId.toLowerCase());

    // If no result is found, result is false
    if (!result) {
        result = false;
    }

    return result; // return the result
}

/* Parse json category list into categoryList global array */
/* Requires: */
/*  jsonList: category json list */
/* Inserts objects with the following properties: */
/*      category: Category name */
/*      category_icon: Font Awesome icon class */
// eslint-disable-next-line no-unused-vars
function createCategoryArray(jsonList) {
    // Redefine the global as an empty array
    categoryList = [];

    /* If the page contains a quizSearchResults container elem, the */
    /* categoryList global will be utilised by a filter select box. Add an */
    /* additional 'All' object at position 0 */
    if ($('#quizSearchResults').length) {
        categoryList.push({'category': 'All', 'category_icon': 'fa-asterisk'});
    }

    // For each object in the list...
    jsonList.forEach(function (obj) {
        // Add an object to the global categoryList array
        categoryList.push({"category": obj.category, // category name
            "category_icon": obj.category_icon.class}); // icon class
    });
}

/* Return category object from global categoryList array */
/* Requires: */
/*  catId: String representing the category to locate */
/* Returns: */
/*  Object with the following properties: */
/*      category: Category name */
/*      category_icon: Font Awesome icon class */
// eslint-disable-next-line no-unused-vars
function getCategory(catId) {

    /* Locate a record within the global categoryList array based on the */
    /* category name */
    let result = categoryList.find(
        (category) => category.category.toLowerCase() === catId.toLowerCase());

    // If no result is found, result is false
    if (!result) {
        result = false;
    }

    return result; // return the result
}

/* Return observer object from global observerList array */
/* Requires: */
/*  elem: element being observed */
/* Returns: */
/*  Object with the following properties: */
/*      elem: Observed element */
/*      obs: MutationObserver applied to elem */
/*      listIndex: Observer object position in global observerList array */
function getObserver(elem) {
    // Define observer var
    let observer;

    /* Locate a record index within the global observerList array based on */
    /* the element */
    let observerIndex = observerList.findIndex((obj) => obj.elem === elem);

    // If a valid index is returned...
    if (observerIndex > -1) {
        observer = observerList[observerIndex]; // Get the observer object
        observer.listIndex = observerIndex; // Add the array index as a property
    } else {
        observer = false; // Otherwise observer is false
    }

    return observer; // return observer
}

/* Stop observer for specified element */
/* Requires: */
/*  elem: element being observed */
// eslint-disable-next-line no-unused-vars
function stopObserver(elem) {
    // Get the observer object for the specified element
    let observer = getObserver(elem);

    // If an observer object is located...
    if (observer) {
        // disconnect the mutation observer
        observer.obs.disconnect();

        // Remove the observer object from the global observerList array
        observerList.splice(observer.listIndex, 1);
    }
}

/* Add an observer object to the global observerList array */
/* The observer object has the following properties: */
/*  elem: Observed element */
/*  obs: MutationObserver applied to elem */
/* Requires: */
/*  elem: element being observed */
/*  func: Callback function to be executed by the observer */
/* Returns: */
/*  MutationObserver applied to the element */
// eslint-disable-next-line no-unused-vars
function addObserver(elem, func) {
    // Declare observerObject var
    let observerObject;

    // Get the observer object for the specified element
    let observer = getObserver(elem);

    // If an observer object is located...
    if (observer) {
        // Disconnect the existing mutation observer
        observerList[observer.listIndex].obs.disconnect();

        // Replace the observer with a new one referencing the new callback func
        observerList[observer.listIndex].obs = new MutationObserver(func);

        // return new mutation observer
        return observerList[observer.listIndex].obs;
    }

    // If no observer is located, create a new observer object
    observerObject = {
        elem, // Observed element
        'obs': new MutationObserver(func) // Observer with callback function
    };

    // Add the object to the global observerList array
    observerList.push(observerObject);

    // return new mutation observer
    return observerObject.obs;
}

/* Update displayed text in an input label */
/* Requires: */
/*  elemId: element Id of the input who's label we wish to update */
// eslint-disable-next-line no-unused-vars
function setInputLabel(elemId) {
    // Define label selector
    let label = `label[for="${elemId}"]`;

    // Get default label text
    let labelText = $(label).attr("data-default");

    // Define label color var
    let labelColor = '';

    // If the input element has the invalid class...
    if ($(`#${elemId}`).hasClass('invalid')) {
        // Get the error label text
        labelText = $(label).attr("data-error");

        // Set the label color to the MaterializeCSS invalid class color
        labelColor = "#F44336";
    }

    // Set the label text and color
    $(label).html(labelText).
        css("color", labelColor);
}

/* Get the font awesome icon class for the provided category */
/* Requires: */
/*  category: category name */
/* Returns: */
/*  String containing the font awesome icon class */
function getCategoryIconClass(category) {
    // Call getCategory() to return the icon class string
    return getCategory(category.toLowerCase()).category_icon;
}

/* Add category font awesome icon class to an element */
/* Requires: */
/*  elem: Element to which the class will be applied */
/*  category: Name of the category who's icon class will be applied */
function setSelectIcon(elem, category) {
    // Call getCategoryIconClass() to return the icon class string
    let iconClass = getCategoryIconClass(category.toLowerCase());

    // Add the class to the element
    elem.addClass(iconClass);
}

/* Remove category font awesome icon class from an element */
/* Requires: */
/*  elem: Element from which the class will be removed */
/*  category: Name of the category who's icon class will be removed */
function clearSelectIcon(elem, value) {
    // Call getCategoryIconClass() to return the icon class string
    let iconClass = getCategoryIconClass(value.toLowerCase());

    // Remove the class from the element
    elem.removeClass(iconClass);
}

/* Set the value of a MaterializeCSS Select box */
/* Requires: */
/*  elem: .subopt element (or jQuery object) */
/*  value: displayed text of the .subopt element */
// eslint-disable-next-line no-unused-vars
function setSelectValue(elem, value) {
    // For each element...
    // (i declaration required by jQuery .each)
    $(elem).each((i, el) => {
        // Get the select container
        let selectContainer = el.closest('.select-container');

        // Get the select icon prefix
        let selectIcon = $('i.prefix', selectContainer);

        // Clear the category icon class from the icon prefix element
        clearSelectIcon(selectIcon, value.toLowerCase());

        // Get the hidden .optgroup-option
        let selector = '.select-wrapper ul li.optgroup-option';

        /* Get a jQuery object containing .optgroup-option elements within */
        /* the .select-container element, then convert the object into an */
        /* array using Object.keys.map */
        /* Use array.find() to locate the element with a matching text value, */
        /* then call the click event on that element */
        Object.keys($(selector, selectContainer)).
            map((key) => $(selector, selectContainer)[key]).
                find((obj) => obj.innerText.
                    toLowerCase() === value.toLowerCase()).
                        click();

        /* Call setSelectIcon() to add the category class icon to the icon */
        /* prefix element */
        setSelectIcon(selectIcon, value);
    });
}

/* Add click listener to .subopt elements */
// eslint-disable-next-line no-unused-vars
function listenToSelect() {
    // Define the .subopt element selector
    let selector = ".select-container .select-wrapper ";
    selector += "ul li.optgroup span div.subopt";

    // Define the click listener
    $(selector).on("click", (e) => {
        // Get the original select element
        let selectContainer = $(e.currentTarget).closest('.select-container');
        let select = $('.select-wrapper select', selectContainer);

        // Get the innerText value of the clicked element
        let value = e.currentTarget.innerText.trim().toLowerCase();

        // Set the value of the select element to match the clicked element
        setSelectValue(select, value);

        /* If the select element is a #quizCategory select and */
        /* .round-category select elems exist */
        if (select.attr('id') === 'quizCategory' &&
            $('.round-category').length) {

            /* Set the value of each .round-category select element to match */
            /* the value of the #quizCategory select element */
            setSelectValue($('.round-category'), value);

            /* If the value is 'general knowledge' then remove the disabled  */
            /* attribute from each .round-category select element */
            if (value === 'general knowledge') {
                // (i declaration required by jQuery .each)
                $('.round-category').each((i, el) => {
                    // Use Attr for disabled instead of Prop.
                    // MaterializeCSS relies on the presence of the Attr.
                    $(el).removeAttr('disabled');
                });

            } else { // Otherwise...
                // Add the disabled attribute to each .round-category element
                // (i declaration required by jQuery .each)
                $('.round-category').each((i, el) => {
                    $(el).attr('disabled', true);
                });
            }
        }
    });
}

/* Create a new validation tracker object as a new property of the global */
/* validationTrackers object */
/* The object has the following properties: */
/*  inProgress: Boolean. Indicates if validation is in progress for the input */
/*  interval: Holds a setInterval() */
/*  counter:  Number. Incremented by setInterval() callback function */
/* Requires: */
/*  elemId: Element Id of the input to be validated */
function createValidationTrackerObj(elemId) {
    // If no validationTracker object exists for this element id..
    if (!validationTrackers[elemId]) {
        // Create a new validationTracker object
        validationTrackers[elemId] = {
            'inProgress': false,
            'interval': 0,
            'counter': 0
        };
    }
}

/* Check whether validation is in progress for an input element */
/* Requires: */
/*  elemId: Element Id of the input to be validated */
function isValidationInProgress(elemId) {
    // If a validation tracker exists for the element id, and inProgress is true
    if (validationTrackers[elemId] &&
            validationTrackers[elemId].inProgress === true) {
        validationTrackers[elemId].counter = 0; // Reset the counter to 0
        return true; // return true
    }

    // Otherwise create a new validation tracker object for this element id
    createValidationTrackerObj(elemId);
    return false; // return false
}

/* Set validation as in progress for an input element */
/* Requires: */
/*  elemId: Element Id of the input to be validated */
function setValidationInProgress(elemId) {
    // Ensure a validation tracker object exists for this element Id
    createValidationTrackerObj(elemId);

    // Set inProgress to true for this element Id
    validationTrackers[elemId].inProgress = true;
}

/* Set validation as no long er in progress for an input element */
/* Requires: */
/*  elemId: Element Id of the input to be validated */
function setValidationComplete(elemId) {
    // Ensure a validation tracker object exists for this element Id
    createValidationTrackerObj(elemId);

    // Set inProgress to false for this element Id
    validationTrackers[elemId].inProgress = false;
}

/* Start monitoring an input element for completed input events before */
/* executing a callback function.
/* Input event listeners will reset the counter on the validation tracker */
/* object for this element to 0.  If the counter hits 4, (incremented by 1 */
/* every .25s) then no input was received for 1s, and the callback is called */
/* Requires: */
/*  elemId: Element Id of the input to be validated */
/*  callback: Callback function to execute when input is complete */
function startValidationInputMonitor(elemId, callback) {
    // Ensure a validation tracker object exists for this element Id
    createValidationTrackerObj(elemId);

    /* Create action for setInterval() */
    const monitorValidationInput = () => {
        // If the counter for this elements validation tracker is < 4...
        if (validationTrackers[elemId].counter < 4) {
            // Increment the counter by 1 and return
            validationTrackers[elemId].counter += 1;
            return;
        }

        /* Otherwise counter has hit 4 (no input received within 1s window) */
        /* so clear the interval */
        clearInterval(validationTrackers[elemId].interval);
        // Reset the counter to 0
        validationTrackers[elemId].counter = 0;
        // Call the callback function
        callback();
    };

    /* Start monitoring the input element for input events once every .25s */
    validationTrackers[elemId].interval = setInterval(
        monitorValidationInput, 250);
}

/* Get the MaterializeCSS Collapsible instance for an input elements helper */
/* Requires: */
/*  elem: Input element whose helper instance is required */
function getInputHelper(elem) {

    // Get the helper element for this input
    let helper = $(elem).closest('.input-field').
        prev('.helper-collapsible');
    // Declare secondary helper var
    let helperXl;

    // If the user is creating a new quiz or editing an existing quiz...
    if ($('#createQuiz').length || $('#editQuiz').length) {
        if ($(helper).length) { // If the helper exists
            // Get the XL screen size helper for this input if it exists
            helperXl = $(elem).closest('.row').
                find('.helper-collapsible.hide-on-large-and-down');

            if ($(helperXl).length) { // If the xl helper exists
                // return an array of the helper instances
                return [
                    M.Collapsible.getInstance(helper[0]),
                    M.Collapsible.getInstance(helperXl[0])
                ];
            }

            // Otherwise return the instance for the helper
            return M.Collapsible.getInstance(helper[0]);
        }
    }

    // Not creating or editing, and the helper exists
    if ($(helper).length) {
        // return the instance for the helper
        return M.Collapsible.getInstance(helper[0]);
    }

    return false; // No helper element located
}

/* Open helper MaterializeCSS Collapsible(s) */
/* Requires: */
/*  helperInstance: Either a MaterializeCSS Collapsible instance, or an */
/*                  Array of MaterializeCSS Collapsible instances */
/*  i: OPTIONAL. Number.  Index of collapsible element to open (default is 0) */
function openInputHelper(helperInstance, i = 0) {
    // Array of instances
    if (Array.isArray(helperInstance)) {
        // Iterate over each instance, opening the element at position i
        helperInstance.forEach((helper) => helper.open(i));
        return;
    }

    // Single instance, so open the element at position i
    helperInstance.open(i);
}

/* Close helper MaterializeCSS Collapsible(s) */
/* Requires: */
/*  helperInstance: Either a MaterializeCSS Collapsible instance, or an */
/*                  Array of MaterializeCSS Collapsible instances */
/*  i: OPTIONAL. Number.  Index of collapsible element to open (default is 0) */
function closeInputHelper(helperInstance, i = 0) {
    // Array of instances
    if (Array.isArray(helperInstance)) {
        // Iterate over each instance, closing the element at position i
        helperInstance.forEach((helper) => helper.close(i));
        return;
    }

    // Single instance, so close the element at position i
    helperInstance.close(i);
}

/* Determine the element id to use to reference the quiz title element a page */
function getQuizTitleId() {
    // Declare elemId as '#quizTitle' by default
    let elemId = '#quizTitle';

    // If we are on a quiz search page, or viewing a quiz..
    if ($('.quiz-search').length || $('#viewQuiz').length) {
        // Set elemId to '#modalQuizTitle'
        elemId = '#modalQuizTitle';
    }

    return elemId; // return the elemId
}

/* Validate a quiz title input element */
/* Optional Parameters: */
/*  invalid: callback function to execute if quiz title input is invalid */
/*  valid: callback function to execute if quiz title input is valid */
/*  override: Boolean. Ignore in progress validation and validate again */
/*            immediately. (Default: false) */
function quizTitleValidate(invalid, valid, override = false) {
    // Get the quiz title element id
    let elemId = getQuizTitleId();

    // If validation is in progress and override is false, return
    if (isValidationInProgress(elemId) === true && override !== true) {
        return;
    }

    // If override is false, set validation in progress
    if (override !== true) {
        setValidationInProgress(elemId);
    }

    /* Validate the input element */
    const validate = () => {

        /* Set the quiz title label text, class and enable the submit button */
        /* Requires: */
        /*  dataAttr: data attribute to utilise to populate label text */
        const setQuizTitleLabel = (dataAttr) => {

            // If the data attribute is not present, return an error
            if (!$(`${elemId} ~ label`).attr(`data-${dataAttr}`)) {
                console.log(`Error: data attr (${dataAttr}) does not exist`);
                return;
            }

            /* Set the validation class */
            /* Requires: */
            /*  valid: Boolean. Reflects whether quiz title is valid */
            const setValidationClass = (valid) => {
                // If not valid...
                if (!valid) {
                    $(elemId).removeClass("valid"). // remove the valid class
                        addClass("invalid"); // add the invalid class
                    return; // return
                }

                // Otherwise..
                $(elemId).removeClass("invalid"). // remove the invalid class
                    addClass("valid"); // add the valid class
            };

            /* Update the label text */
            const updLabelText = () => {
                // Set the label text to the data attribute
                $(`${elemId} ~ label`).
                    html($(`${elemId} ~ label`).
                        data(dataAttr));

                // Get the helper collapsible instance
                let helperCollapsible = getInputHelper($(elemId));

                // If an instance is returned...
                if (helperCollapsible) {
                    // If the specified data attribute was 'error'...
                    if (dataAttr === 'error') {
                        // Open the helper collapsible
                        openInputHelper(helperCollapsible);
                        return; // return
                    }

                    // Otherwise close the helper
                    closeInputHelper(helperCollapsible);
                }
            };

            /* Enable duplicate title modal submit button (if it exists) */
            /* Requires: */
            /*  enabled: Boolean. Desired enabled state of button */
            const enableSubmitButton = (enabled) => {
                // If the button is present...
                if ($('#modalCopyQuizButton').length) {
                    // If enabled is false
                    if (!enabled) {
                        // Set the disabled attribute to true and return
                        $('#modalCopyQuizButton').attr('disabled', true);
                        return;
                    }

                    // Otherwise set the disabled attribute to false
                    $('#modalCopyQuizButton').attr('disabled', false);
                }
            };

            // Check the dataAttr variable and take appropriate action
            switch (dataAttr) {
            case 'error': // data-error
            case 'dup': // data-dup
                setValidationClass(false); // Add invalid class
                updLabelText(); // update the label text
                enableSubmitButton(false); // Disable the submit button
                break;
            case 'default': // data-default
                setValidationClass(true); // Add valid class
                updLabelText(); // update the label text
                enableSubmitButton(true); // Enable the submit button
                break;
            default:
            }
        };

        /* Get the quiz title value */
        let quizTitle = $(elemId).val().
            trim();

        // If the quiz title length is < 5 or > 100...
        if (quizTitle.length < 5 || quizTitle.length > 100) {
            // Call setQuizTitleLabel() for 'error'
            setQuizTitleLabel('error');

            // If the invalid callback function was provided, call it
            if (invalid) {
                invalid(quizTitle);
            }

            // If override is false, set validation complete
            if (override !== true) {
                setValidationComplete(elemId);
            }

            return false; // quiz title is invalid, so return false
        }

        // Create xHttp request object to validate the quiz title value
        let request = {
            'type':
                'validate_quiz_title',
            'params': {
                quizTitle
            }
        };

        /* If the quiz title has the data-id attribute, add the id parameter */
        /* to the xHttp request */
        if ($(elemId).attr('data-id')) {
            request.params.id = $(elemId).attr('data-id');
        }

        // Call xHttpRequest() to validate the quiz title value
        let xhttp = xHttpRequest(request);

        // On ready state change...
        xhttp.onreadystatechange = () => {
            // If the ready state is 4 or 200...
            if (xhttp.readyState === 4 && xhttp.status === 200) {
                // If the responseText is 'false'...
                if (xhttp.responseText === 'false') {
                    // Call setQuizTitleLabel() for 'dup' (title already exists)
                    setQuizTitleLabel('dup');

                    // If the invalid callback function was provided, call it
                    if (invalid) {
                        invalid(quizTitle);
                    }

                    // If override is false, set validation complete
                    if (override !== true) {
                        setValidationComplete(elemId);
                    }

                    return false; // quiz title is invalid, so return false
                }

                /* Otherwise responseText is not 'false' so call */
                /* setQuizTitleLabel() for 'default' */
                setQuizTitleLabel('default');

                // If the valid callback function was provided, call it
                if (valid) {
                    valid(quizTitle);
                }

                // If override is false, set validation complete
                if (override !== true) {
                    setValidationComplete(elemId);
                }

                return true; // quiz title is valid, so return true
            }
        };
    };

    // Start an input monitor for this element, with validate as the callback
    startValidationInputMonitor(elemId, validate);
}

/* Add input listener to quiz title elements */
// eslint-disable-next-line no-unused-vars
function listenToQuizTitle() {
    // On input, call quizTitleValidate()
    $('#quizTitle, #modalQuizTitle').on("input", () => {
        quizTitleValidate();
    });
}

/* Display image previews */
/* Requires: */
/*  elem: img element */
// eslint-disable-next-line no-unused-vars
function imgPreviewLoad(elem) {
    // Remove the hidden class from the img element
    $(elem).removeClass('hidden');

    // Remove the next sibling of the img element (preloader)
    $(elem).next().
        remove();
}

/* Display image preview error */
/* Requires: */
/*  elem: img element */
/*  errText: text displayed on error */
// eslint-disable-next-line no-unused-vars
function imgPreviewError(elem, errText) {
    // Remove the next sibling of the img element (preloader)
    $(elem).next().
        remove();

    /* Append a paragraph element to the img elements parent container, and */
    /* add the errText */
    $(elem).parent().
        append(`<p>${errText}</p>`);

    // Append inline style to the paragraph element, adding padding and a border
    $(elem).next().
        attr('style', "padding: 10px; border: solid 1px black");
}

/* Populate the Title and Message for the changeConfModal */
/* Requires: */
/*  type: code representing the type of change to be confirmed */
/*  elem: clicked element originating the popChangeConfModal() call */
// eslint-disable-next-line no-unused-vars
function popChangeConfModal(type, elem) {
    // Set modal title
    let title = 'Confirmation Required';

    // Set modal message based on type
    let message;
    switch (type) {
    case 'sa': // Single answer
        message = 'If you disable multiple choice, all existing multiple ' +
        'choice options for this question will be deleted.';
        break;
    case 'mc': // Multiple Choice
        message = 'If you enable multiple choice, existing answer data for ' +
        'this question will be deleted.';
        break;
    case 'rq': // Remove question
        message = 'Are you sure you wish to delete this question?';
        break;
    case 'rr': // Remove round
        message = 'If you delete this round, all associated questions will ' +
        'also be deleted.';
        break;
    case 'dq': // Delete quiz
        message = 'If you delete this quiz, all associated rounds and ' +
        'questions will also be deleted.';
        break;
    case 'ce': // Cancel edit
        message = 'All unsaved changes will be lost.';
        break;
    case 'cn': // Cancel new
        message = 'This quiz will not be created, and any content added to ' +
        'this form will be lost.';
        break;
    case 'rm': // Remove multiple choice option
        message = 'Are you sure you wish to delete this multiple choice ' +
        'option?';
        break;
    default:
        return;
    }

    // If type is not rq or rm, append 'Do you wish to continue?' to the message
    if (type !== 'rq' && type !== 'rm') {
        message += '<br><br>Do you wish to continue?';
    }

    // display the title
    $('#modalTitle').html(title);

    // display the message
    $('#modalMessage').html(message);

    // Set the removeActionParams global object
    removeActionParams = {type, elem};

    // Get the MaterializeCSS Modal instance for the changeConfModal
    let instance = M.Modal.
        getInstance(document.querySelector('#changeConfModal'));

    // Open the modal
    instance.open();
}

/* Execute a function based on the type of change that was confirmed */
/* Requires: */
/*  type: code representing the type of change that was confirmed */
/*  elem: clicked element originating the popChangeConfModal() call */
// eslint-disable-next-line no-unused-vars
function removeAction({type, elem}) {
    switch (type) {
    case 'sa': // Single answer
    case 'mc': // Multiple choice
        checkBoxMulti(elem); // Toggle Multiple choice on/off
        break;
    case 'rq': // Remove question
        removeQAction(elem);
        break;
    case 'rr': // Remove round
        removeRoundAction(elem);
        break;
    case 'dq': // Delete quiz
        deleteQuiz($(elem).attr('data-quizId'));
        break;
    case 'ce': // Cancel edit
    case 'cn': // Cancel new
        window.location.href = $(elem).
            attr('href'); // Open the url in the href attribute of the element
        break;
    case 'rm': // Remove multiple choice option
        removeMultiAction(elem);
        break;
    default:
    }
}

/* Initialise the changeConfModal */
// eslint-disable-next-line no-unused-vars
function initChangeConfModal() {

    /* Callback function on modal close */
    const resetModal = () => {
        // If the removeActionParams global object exec parameter is false...
        // eslint-disable-next-line no-unused-vars
        if (!removeActionParams.exec) {
            // Confirmation was denied...
            switch (removeActionParams.type) {
            case 'sa': // Single answer
                // Check the .quizMulti checkbox
                $(removeActionParams.elem).prop('checked', true);
                break;
            case 'mc': // Multiple choice
                // Uncheck the .quizMulti checkbox
                $(removeActionParams.elem).prop('checked', false);
                break;
            default:
            }
        }

        // Clear the removeActionParams global
        removeActionParams = "";

        // Clear the modal title text
        $('#modalTitle').html("");

        // Clear the modal message text
        $('#modalMessage').html("");
    };

    // Initialise MaterializeCSS Modal
    M.Modal.init(document.querySelector('#changeConfModal'), {
        onCloseEnd: resetModal,
        preventScrolling: true
    });
}

/* Add click listeners to changeConfModal yes/no buttons */
// eslint-disable-next-line no-unused-vars
function listenToChangeConfModalButtons() {

    /* Close the modal */
    const modalClose = () => {
        // Get the MaterializeCSS Modal instance
        let instance = M.Modal.
        getInstance(document.querySelector('#changeConfModal'));

        // Close the modal
        instance.close();
    };

    // Add click listener to yes button
    $('#modalYesButton').on("click", () => {
        // Set removeActionParams global object exec parameter to true
        removeActionParams.exec = true;

        // Close the modal
        modalClose();

        // Call removeAction() passing the removeActionParams global object
        removeAction(removeActionParams);
    });


    // Add click listener to no button
    $('#modalNoButton').on("click", () => {
        // Close the modal
        modalClose();
    });
}

/* Close MaterializeCSS Tooltip */
/* Requires: */
/*  elem: .tooltipped element */
function closeToolTip(elem) {
    // Get MaterializeCSS Tooltip instance
    let instance = M.Tooltip.getInstance(elem);

    // If an instance is returned, close it
    if (instance !== undefined) {
        instance.close();
    }
}

/* Determine the element id to use to reference the user id element on a page */
function getUserId() {
    // Declare elemId as '#user_id' by default
    let elemId = '#user_id';

    // If we are on a quiz search page, or viewing a quiz..
    if (!$('#register').length) {
        // Set elemId to '#modalUserId'
        elemId = '#modalUserId';
    }

    return elemId; // return the elemId
}

/* Validate a user id input element */
/* Optional Parameters: */
/*  invalid: callback function to execute if user id input is invalid */
/*  valid: callback function to execute if user id input is valid */
/*  override: Boolean. Ignore in progress validation and validate again */
/*            immediately. (Default: false) */
function userIdValidate(invalid, valid, override = false) {
    let elemId = getUserId();

    // If validation is in progress and override is false, return
    if (isValidationInProgress(elemId) === true && override !== true) {
        return;
    }

    // If override is false, set validation in progress
    if (override !== true) {
        setValidationInProgress(elemId);
    }

    /* Validate the input element */
    const validate = () => {

        /* Set the user Id label text and class */
        /* Requires: */
        /*  dataAttr: data attribute to utilise to populate label text */
        const setUserIdLabel = (dataAttr) => {

            // If the data attribute is not present, return an error
            if (!$(`${elemId} ~ label`).attr(`data-${dataAttr}`)) {
                console.log(`Error: data attr (${dataAttr}) does not exist`);
                return;
            }

            /* Set the validation class */
            /* Requires: */
            /*  valid: Boolean. Reflects whether quiz title is valid */
            const setValidationClass = (valid) => {
                // If not valid...
                if (!valid) {
                    $(elemId).removeClass("valid"). // remove the valid class
                        addClass("invalid"); // add the invalid class
                    return; // return
                }

                // Otherwise..
                $(elemId).removeClass("invalid"). // remove the invalid class
                    addClass("valid"); // add the valid class
            };

            /* Update the label text */
            const updLabelText = () => {
                // Set the label text to the data attribute
                $(`${elemId} ~ label`).
                    html($(`${elemId} ~ label`).
                        data(dataAttr));

                // Get the helper collapsible instance
                let helperCollapsible = getInputHelper($(elemId));

                // If an instance is returned...
                if (helperCollapsible) {
                    // If the specified data attribute was 'error'...
                    if (dataAttr === 'error') {
                        // Open the helper collapsible
                        openInputHelper(helperCollapsible);
                        return; // return
                    }

                    // Otherwise close the helper
                    closeInputHelper(helperCollapsible);
                }
            };

            // Check the dataAttr variable and take appropriate action
            switch (dataAttr) {
            case 'error': // data-error
            case 'dup': // data-dup
                setValidationClass(false); // Add invalid class
                updLabelText(); // update the label text
                break;
            case 'default': // data-default
                setValidationClass(true); // Add valid class
                updLabelText(); // update the label text
                break;
            default:
            }
        };

        /* Get the user_id value */
        let userId = $(elemId).val().
            trim();

        // If the userId length is < 5 or > 15...
        if (userId.length < 5 || userId.length > 15) {
            // Call setUserIdLabel() for 'error'
            setUserIdLabel('error');

            // If the invalid callback function was provided, call it
            if (invalid) {
                invalid(userId);
            }

            // If override is false, set validation complete
            if (override !== true) {
                setValidationComplete(elemId);
            }

            return false; // User Id is invalid, so return false
        }

        // Create xHttp request object to validate the user id value
        let request = {
            'type':
                'validate_user_id',
            'params': {
                'user_id': userId
            }
        };

        /* If the modalOrigUserId element is present, add the orig_user_id */
        /* parameter to the xHttp request */
        if ($('#modalOrigUserId').length) {
            // eslint-disable-next-line camelcase
            request.params.orig_user_id = $('#modalOrigUserId').val().
                trim();
        }

        // Call xHttpRequest() to validate the user id value
        let xhttp = xHttpRequest(request);

        // On ready state change...
        xhttp.onreadystatechange = () => {
            // If the ready state is 4 or 200...
            if (xhttp.readyState === 4 && xhttp.status === 200) {
                // If the responseText is 'false'...
                if (xhttp.responseText === 'false') {
                    // Call setUserIdLabel() for 'dup' (title already exists)
                    setUserIdLabel('dup');

                    // If the invalid callback function was provided, call it
                    if (invalid) {
                        invalid(userId);
                    }

                    // If override is false, set validation complete
                    if (override !== true) {
                        setValidationComplete(elemId);
                    }

                    return false; // user id is invalid, so return false
                }

                /* Otherwise responseText is not 'false' so call */
                /* setUserIdLabel() for 'default' */
                setUserIdLabel('default');

                // If the valid callback function was provided, call it
                if (valid) {
                    valid(userId);
                }

                // If override is false, set validation complete
                if (override !== true) {
                    setValidationComplete(elemId);
                }

                return true; // user id is valid, so return true
            }
        };
    };

    // Start an input monitor for this element, with validate as the callback
    startValidationInputMonitor(elemId, validate);
}

/* Add input listener to user id elements */
// eslint-disable-next-line no-unused-vars
function listenToUserId() {
    // On input, call userIdValidate()
    $('#user_id, #modalUserId').on("input", () => {
        userIdValidate();
    });
}

/* Add click listener to a elements to close tooltip */
function listenToATags() {
    $('a').on('click', (e) => {
        // Close the tooltip for the clicked a element
        closeToolTip(e.currentTarget);
    });
}

/* Compare Password input with Password Confirmation input */
/* Requires: */
/*  compareElem: Password Confirmation input */
/*  noTimeout: OPTIONAL. Boolean.  Compare immediately, skipping 1s delay. */
/*             (Default is false) */
// eslint-disable-next-line no-unused-vars
function passwordComparison(compareElem, noTimeout = false) {
    // If compareElem is neither invalid or valid, and it's value is 0 length...
    if (!$(compareElem).hasClass('invalid') &&
            !$(compareElem).hasClass('valid') &&
                $(compareElem).val() === '') {
        return; // Nothing to compare.  Return.
    }

    // Get the element Id of the password confirmation input
    let compareId = $(compareElem).attr('id');

    // If validation is in progress for this element, return
    if (isValidationInProgress(compareId) === true) {
        return;
    }

    // Set validation in progress
    setValidationInProgress(compareId);

    /* Get the password input element, compare values and set labels */
    const comparePassword = () => {
        // Get the element Id of the password input
        let passwordId = $(compareElem).closest('.password-container').
                find('.input-field.password>input[type="password"]').
                attr('id');

        // Call pWordValidation() to compare the inputs
        pWordValidation(passwordId, compareId);

        // Set input label values for both inputs
        setInputLabel(compareId);

        // Set validation complete
        setValidationComplete(compareId);
    };

    // If noTimeout is true, call comparePassword() and return
    if (noTimeout === true) {
        comparePassword();
        return;
    }

    /* Otherwise, start a validation input monitor with comparePassword() as */
    /* the callback function */
    startValidationInputMonitor(compareId, comparePassword);
}

/* Validate input element */
/* Requires: */
/*  elem: input element to be validated */
/*  noTimeout: OPTIONAL. Boolean.  Compare immediately, skipping 1s delay. */
/*             (Default is false) */
// eslint-disable-next-line no-unused-vars
function inputValidation(elem, noTimeout = false) {
    // Determine whether element is paired
    let paired = false; // Set false by default
    // If the input is a .question, .img-url, .answer or .option...
    if ($(elem).hasClass('question') ||
            $(elem).hasClass('img-url') ||
                $(elem).hasClass('answer') ||
                    $(elem).hasClass('option')) {
        paired = true; // paired is true
    }

    // Get the element Id of the input
    let elemId = $(elem).attr('id');

    // If validation is in progress for this element, return
    if (isValidationInProgress(elemId) === true) {
        return;
    }

    // Set validation in progress
    setValidationInProgress(elemId);

    /* Validate the input element */
    const validate = () => {
        // Define variables
        let helperCollapsible;
        let compareElem;
        let imgInput;

        // If input is not paired, get the helper instance
        if (paired === false) {
            helperCollapsible = getInputHelper(elem);
        }

        // If the input is valid...
        if ($(elem).is(':valid')) {
            $(elem).removeClass('invalid'). // remove the invalid class
                removeClass('valid'); // remove the valid class

            // If the value length is > 0...
            if ($(elem).val().
                    trim().length > 0) {
                $(elem).addClass('valid'); // add the valid class
            }

            // If the helper instance was returned, close the helper
            if (helperCollapsible) {
                closeInputHelper(helperCollapsible);
            }
        } else if ($(elem).is(':invalid')) { // If the input is invalid...
            $(elem).removeClass('valid'). // remove the valid class
                addClass('invalid'); // add the invalid class

            // If the helper instance was returned, open the helper
            if (helperCollapsible) {
                openInputHelper(helperCollapsible);
            }
        }

        // Set the input label text
        setInputLabel(elemId);

        // if the input type is password...
        if ($(elem).attr('type') === 'password') {
            // Get the password confirmation input
            compareElem = $(elem).closest('.password-container').
                find('.input-field.compare-password>input[type="password"]');

            // If the password confirmation input is returned...
            if (compareElem.length) {
                // Compare the passwords
                passwordComparison(compareElem, true);
            }
        } else if ($(elem).hasClass('img-url')) { // If the input is .img-url...
            // validate the url
            checkImgUrl(elem);

            // Call imgPreview() to handle img html generation and image display
            imgPreview($(elem).val(),
                $(elem).closest('.input-field').
                    next());
        } else if (!$(elem).hasClass('img-url')) { // If input isn't .img-url...
            // Check for img-input
            imgInput = $(elem).parent().
                    next().
                        next();
            // If this element has the .option class...
            if ($(elem).hasClass('option')) {
                // Adjust by one sibling to account for .correct checkbox
                imgInput = $(imgInput).next();
            }

            // Look for an .img-url input within the current element
            imgInput = $(imgInput).children('input.img-url');

            // If an .img-input is found...
            if ($(imgInput).length) {
                // Validate the url
                checkImgUrl(imgInput, true);
            }
        }

        // Set validation complete
        setValidationComplete(elemId);
    };

    // If noTimeout is true, call validate() and return
    if (noTimeout === true) {
        validate();
        return;
    }

    // Otherwise, start a validation input monitor with validate() as callback
    startValidationInputMonitor(elemId, validate);
}

/* Add input event listener to input elements */
// eslint-disable-next-line no-unused-vars
function listenToInputs() {

    /* Define input element selector, avoiding .compare-password and quiz */
    /* title inputs */
    let inputSelector = ".input-field:not(.compare-password)>" +
        "input:not(#quizTitle, #modalQuizTitle, #user_id, #modalUserId)";

    // Add input listener to call inputValidation()
    $(inputSelector).on("input", (e) => inputValidation(e.currentTarget));

    /* Add input listener to .compare-password inputs to call */
    /* passwordComparison() */
    $('.input-field.compare-password>input[type="password"]').
        on("input", (e) => passwordComparison(e.currentTarget));
}

/* Initialise MaterializeCSS Modal instance for formValidationModal */
// eslint-disable-next-line no-unused-vars
function initFormValidationModal() {
    $('#formValidationModal').modal();
}

/* Reset #modalQuizTitle input */
// eslint-disable-next-line no-unused-vars
function resetModalQuizTitleInput() {
    // Remove the data-prev value from #modalQuizTitle
    $('#modalQuizTitle').attr('data-prev', '');

    if ($('#viewQuiz').length) {
        // Set the value of #modalQuizTitle to #quizOriginalTitle html
        $('#modalQuizTitle:hidden').
            val($('#quizOriginalTitle').html());

        // Call quizTitleValidate() to reset #modalQuizTitle input helper
        quizTitleValidate();
        return;
    }

    // Remove the #modalQuizTitle input value
    $('#modalQuizTitle:hidden').val('');

    // Close the #modalQuizTitle input helper
    getInputHelper($('#modalQuizTitle')).close();

    // Remove the data-quizId attribute value from #modalCopyQuizButton
    $('#modalCopyQuizButton').attr('data-quizId', '');
}

/* Document Ready Function */
$(function() {
    // Initialise MaterializeCSS Sidenav
    $('.sidenav').sidenav({edge: "right"});

    // Add click listeners to a elements to close tooltips
    listenToATags();

    // Initialise MaterializeCSS Tooltips
    $('.tooltipped').tooltip();

    // Initialise MaterializeCSS Collapsibles for .helper-collapsible elements
    $('.collapsible.helper-collapsible').collapsible();

    // Initialise MaterializeCSS Collapsibles for .expandable elements
    $('.collapsible.expandable').collapsible({accordion: false});

    // Initialise remaining MaterializeCSS Collapsibles
    $('.collapsible:not(.expandable, .helper-collapsible)').collapsible();

    // Add input event listeners to input elements
    listenToInputs();
});