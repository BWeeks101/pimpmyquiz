/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global getCategory, observerList, stopListeningToSelect, listenToSelect,
stopListeningToMultiControls, listenToMultiControls, stopListeningToQControls,
listenToQControls, categoryList, stopListeningToRControls, M,
listenToRControls, listenToImgInputs, listenToImgPreview */

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

function getObserver(elem) {
    let observer = observerList.find((obj) => obj.elem === elem);
    if (observer !== undefined) {
        return observer.obs;
    }
    return observer;
}

function stopObserver(elem) {
    let observer = getObserver(elem);
    observer.disconnect();
}

function addObserver(elem) {
    let observer = getObserver(elem);
    if (observer === undefined) {
        observerList.push({
            elem,
            'obs': new MutationObserver(() => {
                stopListeningToSelect();
                $(elem).formSelect();
                listenToSelect();
            })
        });
    }
}

function reinitSelectOnDisabled(elem) {
    $(elem).each((i, el) => {
        addObserver(el);
        let observer = getObserver(el);
        observer.observe(el, {attributeFilter: ['disabled']});
    });
}

// eslint-disable-next-line no-unused-vars
function addMulti(elem) {
    let rId = parseInt($(elem).closest('.collapsible').
        closest('.collapsible-body').
        prev().
        attr('data-round'));
    let answersContainer = $(elem).closest('.answers-container');
    let multiCount = parseInt($(answersContainer).prev().
        val()) + 1;
    let prefix = $(elem).closest('.prefix');
    let qId = parseInt(prefix.attr('data-question'));
    let mlt = parseInt(prefix.attr('data-multi')) + 1;

    prefix.html("");
    let controlHtml = `
        <a href="#!" ` +
            `class="multi-control-remove ` +
                `light-blue-text text-darken-4">-</a>` +
        `<a href="#!" ` +
            `class="multi-control-add ` +
                `light-blue-text text-darken-4">+</a>`;
    let answerHtml = `
        <div class="input-field col s10">
            <span class="prefix center-align" data-question="${qId}"` +
                `data-multi="${mlt}">
                ${controlHtml}` +
            `</span>
            <input id="answer_${rId}_${qId}_${mlt}" ` +
                `name="answer_${rId}_${qId}_${mlt}" ` +
                `type="text" minlength="1" maxlength="100" ` +
                `class="validate" value="" required>
            <label for="answer_${rId}_${qId}_${mlt}" ` +
                `data-error="Invalid Answer" ` +
                `data-default="Answer ${rId}-${qId}-${mlt}">` +
                `Answer ${rId}-${qId}-${mlt}</label>
        </div>
        <div class="input-field col s2 checkbox-container ` +
            `inline-input center-align">
            <label class="center-align full-width">
                <input id="correct_${rId}_${qId}_${mlt}" ` +
                    `name="correct_${rId}_${qId}_${mlt}" ` +
                    `type="checkbox"/>
                <span></span>
            </label>
        </div>
        <!-- Optional Image URL -->
        <div class="input-field col s12">
            <span class="prefix light-blue-text text-darken-4 ` +
                `center-align"></span>
            <input id="a_img_${rId}_${qId}_${mlt}" ` +
                `name="a_img_${rId}_${qId}_${mlt}" ` +
                `type="url" class="img-url validate" value="">
            <label for="a_img_${rId}_${qId}_${mlt}" data-error="Invalid URL" ` +
                `data-default="Optional Image URL">` +
                `Optional Image URL</label>
        </div>
        <div class="image-preview col s12 center-align"></div>`;

    stopListeningToMultiControls();
    answersContainer.append(answerHtml);
    $(answersContainer).prev().
        val(multiCount);
    listenToMultiControls();
    listenToImgInputs();
}

// eslint-disable-next-line no-unused-vars
function removeMulti(elem) {
    let prefix = $(elem).closest('.prefix');
    let mlt = parseInt(prefix.attr('data-multi')) - 1;
    let inputField = prefix.closest('.input-field');
    let checkboxContainer = inputField.next();
    let imgInputContainer = checkboxContainer.next();
    let imgPreviewContainer = imgInputContainer.next();
    let answersContainer = inputField.closest('.answers-container');
    let multiCount = parseInt($(answersContainer).prev().
        val()) - 1;
    let prevMulti = $(`.prefix[data-multi="${mlt}"]`, answersContainer);

    let controlHtmlRemove = `<a href="#!" ` +
        `class="multi-control-remove light-blue-text text-darken-4">-</a>`;
    let controlHtmlAdd = `<a href="#!" ` +
        `class="multi-control-add light-blue-text text-darken-4">+</a>`;
    let controlHtml;
    if (mlt === 2) {
        controlHtml = controlHtmlAdd;
    } else if (mlt > 2) {
        controlHtml = controlHtmlRemove + controlHtmlAdd;
    }

    stopListeningToMultiControls();
    prevMulti.html(controlHtml);

    inputField.remove();
    checkboxContainer.remove();
    imgInputContainer.remove();
    imgPreviewContainer.remove();
    listenToImgInputs();
    $(answersContainer).prev().
        val(multiCount);
    listenToMultiControls();
}

function checkBoxMulti(elem) {
    let rId = parseInt($(elem).closest('.collapsible').
        closest('.collapsible-body').
        prev().
        attr('data-round'));
    let inputField = $(elem).closest('.checkbox-container');
    let parentBody = inputField.closest('.collapsible-body');
    let questionTitle = parentBody.prev();
    let qId = parseInt(questionTitle.attr('data-question'));
    let targetTitle = inputField.next();
    let targetField = targetTitle.next().next();
    let htmlTitle = `<span class="col s12">What is the Answer?</span>`;
    let htmlContent = `
        <div class="input-field col s12">
            <span class="prefix" data-question="${qId}" data-multi="0"></span>
            <input id="answer_${rId}_${qId}" name="answer_${qId}" ` +
                `type="text" minlength="1" maxlength="100" class="validate" ` +
                `value="" required>
            <label for="answer_${rId}_${qId}" data-error="Invalid Answer" ` +
                `data-default="Answer ${rId}_${qId}">Answer ${rId}_${qId}` +
                `</label>
        </div>
        <!-- Optional Image URL -->
        <div class="input-field col s12">
            <span class="prefix light-blue-text text-darken-4 center-align">` +
                `</span>
            <input id="a_img_${rId}_${qId}" name="a_img_${rId}_${qId}" ` +
                `type="url" class="img-url validate" value="">
            <label for="a_img_${rId}_${qId}" data-error="Invalid URL" ` +
                `data-default="Optional Image URL">Optional Image URL</label>
        </div>
        <div class="image-preview col s12 center-align"></div>`;
    let multiCount = 0;
    if ($(elem).prop('checked')) {
        multiCount = 1;
        htmlTitle = `<span class="col s10">What are the Choices?</span>` +
            `<span class="col s2 center-align">Correct?</span>`;
        htmlContent = "";
        const buildHtml = () => {
            htmlContent += `
                <div class="input-field col s10">
                    <span class="prefix center-align" data-question="${qId}"` +
                        `data-multi="${multiCount}">`;
            if (multiCount === 3) {
                htmlContent += `
                <a href="#!" ` +
                    `class="multi-control-remove ` +
                        `light-blue-text text-darken-4">-</a>` +
                `<a href="#!" ` +
                    `class="multi-control-add ` +
                        `light-blue-text text-darken-4">+</a>`;
            }
            htmlContent += `
                    </span>
                    <input id="answer_${rId}_${qId}_${multiCount}" ` +
                        `name="answer_${rId}_${qId}_${multiCount}" ` +
                        `type="text" minlength="1" maxlength="100" ` +
                        `class="validate" value="" required>
                    <label for="answer_${rId}_${qId}_${multiCount}" ` +
                        `data-error="Invalid Answer" ` +
                        `data-default="Answer ${rId}-${qId}-${multiCount}">` +
                        `Answer ${rId}-${qId}-${multiCount}</label>
                </div>
                <div class="input-field col s2 checkbox-container ` +
                    `inline-input center-align">
                    <label class="center-align full-width">
                        <input id="correct_${rId}_${qId}_${multiCount}" ` +
                            `name="correct_${rId}_${qId}_${multiCount}" ` +
                            `type="checkbox"/>
                        <span></span>
                    </label>
                </div>
                <!-- Optional Image URL -->
                <div class="input-field col s12">
                    <span class="prefix light-blue-text text-darken-4 ` +
                        `center-align"></span>
                    <input id="a_img_${rId}_${qId}_${multiCount}" ` +
                        `name="a_img_${rId}_${qId}_${multiCount}" ` +
                        `type="url" class="img-url validate" value="">
                    <label for="a_img_${rId}_${qId}_${multiCount}" ` +
                        `data-error="Invalid URL" ` +
                        `data-default="Optional Image URL">` +
                        `Optional Image URL</label>
                </div>
                <div class="image-preview col s12 center-align"></div>`;

            if (multiCount < 3) {
                multiCount += 1;
                buildHtml();
            }
        };

        buildHtml();
    }

    targetTitle.html(htmlTitle);
    targetField.html(htmlContent);
    $(`#multiCount_${rId}_${qId}`).val(multiCount);
    listenToMultiControls();
    listenToImgInputs();
}

function checkBoxChanged(elem) {
    let clss = $(elem).attr('class');
    switch (clss) {
    case 'quizMulti':
        checkBoxMulti(elem);
        break;
    }
}

function listenToCheckbox() {
    $('input[type="checkbox"]').
        on("change", (e) => checkBoxChanged(e.currentTarget));
}

function stopListeningToCheckbox() {
    $('input[type="checkbox"]').
        off("change");
}

// eslint-disable-next-line no-unused-vars
function addQ(elem) {
    let rId = parseInt($(elem).closest('.collapsible-body').
        prev().
        attr('data-round'));
    let questionCount = parseInt($(`#questionCount_${rId}`).val()) + 1;
    let qId = parseInt($(elem).closest('.collapsible-header').
        attr('data-question')) + 1;
    let target = $(elem).closest('ul.collapsible');
    let qControls = $(elem).closest('div.qcontrols');
    let html = `
        <li>
        <div class="collapsible-header question-title" data-question="${qId}">
            Question ${qId}
            <svg class="caret" height="32" viewBox="0 0 24 24" width="32" ` +
                    `xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10l5 5 5-5z"></path>
                <path d="M0 0h24v24H0z" fill="none"></path>
            </svg>
            <div class="qcontrols col s2 right-align">
                <a href="#!" ` +
                    `class="qcontrols-remove light-blue-text text-darken-4">` +
                    `-</a>
                <a href="#!" ` +
                    `class="qcontrols-add light-blue-text text-darken-4">+</a>
            </div>
        </div>
        <div class="collapsible-body">
            <div class="row">
                <!-- Question One -->
                <div class="input-field col s12">
                    <span class="prefix light-blue-text text-darken-4 ` +
                        `center-align"></span>
                    <input id="question_${rId}_${qId}" ` +
                        `name="question_${rId}_${qId}" ` +
                        `type="text" minlength="5" maxlength="25" ` +
                        `class="validate" value="" required>
                    <label for="question_${rId}_${qId}" ` +
                        `data-error="Invalid Question" ` +
                        `data-default="Question ${qId}">Question ${qId}</label>
                </div>
                <!-- Optional Image URL -->
                <div class="input-field col s12">
                    <span class="prefix light-blue-text text-darken-4 ` +
                        `center-align"></span>
                    <input id="q_img_${rId}_${qId}" ` +
                        `name="q_img_${rId}_${qId}" ` +
                        `type="url" class="img-url validate" value="">
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
                            `name="quizMulti_${rId}_${qId}" type="checkbox"/>
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
                <div class="answers-container col s12">
                    <div class="input-field col s12">
                        <span class="prefix" data-question="${qId}" ` +
                            `data-multi="0"></span>
                        <input id="answer_${rId}_${qId}" ` +
                            `name="answer_${rId}_${qId}" ` +
                            `type="text" minlength="5" maxlength="25" ` +
                            `class="validate" value="" required>
                        <label for="answer_${rId}_${qId}" ` +
                            `data-error="Invalid Answer" ` +
                            `data-default="Answer ${qId}">Answer ${qId}</label>
                    </div>
                    <!-- Optional Image URL -->
                    <div class="input-field col s12">
                        <span class="prefix light-blue-text text-darken-4 ` +
                            `center-align"></span>
                        <input id="a_img_${rId}_${qId}" ` +
                            `name="a_img_${rId}_${qId}" type="url" ` +
                            `class="img-url validate" value="">
                        <label for="a_img_${rId}_${qId}" ` +
                            `data-error="Invalid URL" ` +
                            `data-default="Optional Image URL"> ` +
                            `Optional Image URL</label>
                    </div>
                    <div class="image-preview col s12 center-align"></div>
                </div>
            </div>
        </div>
    </li>`;
    stopListeningToQControls();
    stopListeningToCheckbox();
    $(qControls).remove();
    $(target).append(html);
    $(`#questionCount_${rId}`).val(questionCount);
    listenToQControls();
    listenToCheckbox();
    listenToImgInputs();
}

// eslint-disable-next-line no-unused-vars
function removeQ(elem) {
    let rId = parseInt($(elem).closest('.collapsible-body').
        prev().
        attr('data-round'));
    let questionCount = parseInt($(`#questionCount_${rId}`).val()) - 1;
    let qId = parseInt($(elem).closest('.collapsible-header').
        attr('data-question')) - 1;
    let target = $(elem).closest('li');
    let prevQ = $(target).prev();
    let qControlsTarget = $('.collapsible-header', prevQ);
    let qControlsHtml = `
        <div class="qcontrols col s2 right-align">`;
    if (qId > 1) {
        qControlsHtml += `
            <a href="#!" ` +
                `class="qcontrols-remove light-blue-text text-darken-4">-</a>`;
    }
    qControlsHtml += `
            <a href="#!" ` +
                `class="qcontrols-add light-blue-text text-darken-4">+</a>
        </div>`;
    stopListeningToQControls();
    stopListeningToCheckbox();
    $(target).remove();
    $(`#questionCount_${rId}`).val(questionCount);
    $(qControlsTarget).append(qControlsHtml);
    listenToQControls();
    listenToCheckbox();
}

// eslint-disable-next-line no-unused-vars
function addRound(elem) {
    let rId = parseInt($(elem).closest('.collapsible-header').
        attr('data-round')) + 1;
    let rCount = parseInt($('#roundCount').val()) + 1;
    let target = $(elem).closest('ul.collapsible');
    let rControls = $(elem).closest('div.rcontrols');
    let quizCategory = $('#quizCategory').val();
    let html = `
        <li>
            <div class="collapsible-header round-title" data-round="${rId}">
                Round ${rId}
                <svg class="caret" height="32" viewBox="0 0 24 24" ` +
                        `width="32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5 5 5-5z"></path>
                    <path d="M0 0h24v24H0z" fill="none"></path>
                </svg>
                <div class="rcontrols col s2 right-align">
                    <a href="#!" ` +
                        `class="rcontrols-remove light-blue-text ` +
                            `text-darken-4">` +
                        `-</a>
                    <a href="#!" ` +
                        `class="rcontrols-add light-blue-text text-darken-4">` +
                        `+</a>
                </div>
            </div>
            <div class="collapsible-body">
                <div class="row round-row">
                    <span class="title col l12 hide-on-med-and-down">
                        Choose a Category and Provide a Title for this Round
                    </span>
                    <!-- Round Category -->
                    <span class="title col m12 hide-on-large-only">
                        Choose a Category for this Round
                    </span>
                    <div class="input-field col m12 l5 select-container">
                        <i id="roundCategoryIcon_${rId}" ` +
                            `class="prefix light-blue-text text-darken-4 ` +
                            `fas"></i>
                        <select id="roundCategory_${rId}" ` +
                            `class="round-category" ` +
                            `name="roundCategory_${rId}">`;
    categoryList.forEach((category) => {
        html += `
                            <optgroup label='<div class="subopt">
                                <i class="fas ${category.category_icon} ` +
                                    `fa-fw light-blue-text text-darken-4">` +
                                    `</i> ` +
                                `<span class="light-blue-text text-darken-4">
                                    ${category.category}
                                </span></div>'>
                                <option>${category.category}</option>
                            </optgroup>`;
    });
    html += `
                        </select>
                        <label>Round Category</label>
                    </div>
                    <!-- Round Name -->
                    <span class="title col m12 hide-on-large-only">
                        Provide a Title for this Round
                    </span>
                    <div class="input-field col m12 l7 ">
                        <input id="roundTitle_${rId}" ` +
                            `name="round_title_${rId}" type="text" ` +
                            `minlength="5" maxlength="25" class="validate" ` +
                            `value="Round ${rId}" required>
                        <label for="roundTitle_${rId}" ` +
                            `data-error="Invalid Round Title" ` +
                            `data-default="Round Title">Round Title</label>
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
                            <li class="active">
                                <div ` +
                                        `class="collapsible-header ` +
                                        `question-title" data-question="1">
                                    Question 1
                                    <svg class="caret" height="32" ` +
                                            `viewBox="0 0 24 24" width="32" ` +
                                            `xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 10l5 5 5-5z"></path>
                                        <path d="M0 0h24v24H0z" fill="none">` +
                                        `</path>
                                    </svg>
                                    <div class="qcontrols col s2 right-align">
                                        <a href="#!" ` +
                                            `class="qcontrols-add ` +
                                            `light-blue-text text-darken-4">` +
                                            `+</a>
                                    </div>
                                </div>
                                <div class="collapsible-body">
                                    <div class="row">
                                        <!-- Question One -->
                                        <div class="input-field col s12">
                                            <span ` +
                                                `class="prefix ` +
                                                `light-blue-text ` +
                                                `text-darken-4 center-align">` +
                                                `</span>
                                            <input id="question_${rId}_1" ` +
                                                `name="question_${rId}_1" ` +
                                                `type="text" minlength="5" ` +
                                                `maxlength="25" ` +
                                                `class="validate" value="" ` +
                                                `required>
                                            <label for="question_${rId}_1" ` +
                                                `data-error=` +
                                                    `"Invalid Question" ` +
                                                `data-default="Question 1">
                                                    Question 1
                                            </label>
                                        </div>
                                        <!-- Optional Image URL -->
                                        <div class="input-field col s12">
                                            <span class="prefix ` +
                                                `light-blue-text ` +
                                                `text-darken-4 center-align">` +
                                                `</span>
                                            <input id="q_img_${rId}_1" ` +
                                                `name="q_img_${rId}_1" ` +
                                                `type="url" ` +
                                                `class="img-url validate" ` +
                                                `value="">
                                            <label for="q_img_${rId}_1" ` +
                                                `data-error="Invalid URL" ` +
                                                `data-default=` +
                                                    `"Optional Image URL">
                                                Optional Image URL
                                            </label>
                                        </div>
                                        <div class="image-preview col s12 ` +
                                            `center-align"></div>
                                        <!-- Multiple Choice? -->
                                        <span class="title col s12">
                                            Is this a multiple choice Question?
                                        </span>
                                        <div class="input-field col s12 ` +
                                                `checkbox-container">
                                            <i class="prefix light-blue-text ` +
                                                `text-darken-4"></i>
                                            <label id="quizMulti_${rId}_1">
                                                <input id=` +
                                                    `"quizMultiInput_` +
                                                        `${rId}_1" ` +
                                                    `class="quizMulti" ` +
                                                    `name="quizMulti_` +
                                                        `${rId}_1" ` +
                                                    `type="checkbox"/>
                                                <span>Multiple Choice?</span>
                                            </label>
                                        </div>
                                        <!-- Answer -->
                                        <div class="title col s12">
                                            <span class="col s12">
                                                What is the Answer?
                                            </span>
                                        </div>
                                        <input id="multiCount_${rId}_1" ` +
                                            `name="multiCount_${rId}_1" ` +
                                            `type="text" ` +
                                            `class="hidden" value="1">
                                        <div class="answers-container col s12">
                                            <div class="input-field col s12">
                                                <span class="prefix" ` +
                                                    `data-question="1" ` +
                                                    `data-multi="0">
                                                </span>
                                                <input id="answer_${rId}_1" ` +
                                                    `name="answer_${rId}_1" ` +
                                                    `type="text" ` +
                                                    `minlength="5" ` +
                                                    `maxlength="25" ` +
                                                    `class="validate" ` +
                                                    `value="" required>
                                                <label for="answer_${rId}_1" ` +
                                                    `data-error=` +
                                                        `"Invalid Answer" ` +
                                                    `data-default="Answer 1">
                                                        Answer 1
                                                </label>
                                            </div>
                                            <!-- Optional Image URL -->
                                            <div class="input-field col s12">
                                                <span class="prefix ` +
                                                    `light-blue-text ` +
                                                    `text-darken-4 ` +
                                                    `center-align"></span>
                                                <input id="a_img_${rId}_1" ` +
                                                    `name="a_img_${rId}_1" ` +
                                                    `type="url" ` +
                                                    `class="img-url ` +
                                                        `validate" ` +
                                                    `value="">
                                                <label for="a_img_${rId}_1" ` +
                                                    `data-error=` +
                                                        `"Invalid URL" ` +
                                                    `data-default=` +
                                                        `"Optional Image URL"` +
                                                    `>Optional Image URL</label>
                                            </div>
                                            <div class="image-preview col ` +
                                                `s12 center-align">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </li>
    `;
    stopListeningToRControls();
    stopListeningToQControls();
    stopListeningToCheckbox();
    $(rControls).remove();
    $(target).append(html);
    $('#roundCount').val(rCount);
    M.updateTextFields();
    $('.collapsible').collapsible();
    listenToRControls();
    listenToQControls();
    listenToCheckbox();
    stopListeningToSelect();
    $('select').formSelect();
    listenToSelect();
    setSelectValue($(`#roundCategory_${rId}`), quizCategory);
    reinitSelectOnDisabled($(`#roundCategory_${rId}`));
    if (quizCategory !== 'general knowledge') {
        $(`#roundCategory_${rId}`).attr('disabled', true);
    }
    listenToImgInputs();
}

// eslint-disable-next-line no-unused-vars
function removeRound(elem) {
    let rId = parseInt($(elem).closest('.collapsible-header').
        attr('data-round'));
    let rCount = parseInt($('#roundCount').val()) - 1;
    let select = $(`#roundCategory_${rId}`)[0];
    rId -= 1;
    let target = $(elem).closest('li');
    let prevR = $(target).prev();
    let rControlsTarget = $('.collapsible-header[data-round]', prevR);
    let rControlsHtml = `
        <div class="rcontrols col s2 right-align">`;
    if (rId > 1) {
        rControlsHtml += `
            <a href="#!" ` +
                `class="rcontrols-remove light-blue-text text-darken-4">-</a>`;
    }
    rControlsHtml += `
            <a href="#!" ` +
                `class="rcontrols-add light-blue-text text-darken-4">+</a>
        </div>`;

    stopListeningToRControls();
    stopListeningToSelect();
    stopObserver(select);
    stopListeningToQControls();
    stopListeningToCheckbox();
    $(target).remove();
    $('#roundCount').val(rCount);
    $(rControlsTarget).append(rControlsHtml);
    listenToRControls();
    $('select').formSelect();
    listenToSelect();
    listenToQControls();
    listenToCheckbox();
}

// eslint-disable-next-line no-unused-vars
function imgPreviewLoad(elem) {
    let self = $(elem);
    let img = {
        'height': self.height(),
        'width': self.width()
    };
    let max = 600;
    let val;
    if (img.width > img.height) {
        val = (max / 100) * ((img.height / img.width) * 100);
        self.height(val);

    } else {
        val = (max / 100) * ((img.width / img.height) * 100);
        self.width(val);
    }
    $(elem).next().
        remove();
    $(elem).removeClass('hidden');
}

// eslint-disable-next-line no-unused-vars
function imgPreviewError(elem) {
    $(elem).next().
        remove();
    $(elem).removeClass('hidden');
    $(elem).attr('alt', "Unable to preview Image.  Please check the URL.");
    $(elem).attr('style', "padding: 10px; border: solid 1px black");
}

function imgPreviewPreloader(elem) {
    let html = `
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
    $(elem).append(html);
}

// eslint-disable-next-line no-unused-vars
function imgPreview(elem) {
    let imgUrl = $(elem).val();
    let target = $(elem).closest('.input-field').
    next();
    if (imgUrl.length === 0) {
        target.html('');
        return;
    }
    $(target).html(`<img class="hidden" src="${imgUrl}" ` +
        `alt="Image Preview"></img>`);
    imgPreviewPreloader(target);
    listenToImgPreview();
}

$(function() {
    listenToCheckbox();
    listenToSelect();
    setSelectValue($('#quizCategory'), 'general knowledge');
    setSelectValue($('#roundCategory_1'), 'general knowledge');
    reinitSelectOnDisabled($('.round-category'));
    listenToRControls();
    listenToQControls();
    listenToImgInputs();
});