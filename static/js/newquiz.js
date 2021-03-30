/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global observerList, stopListeningToSelect, listenToSelect,
stopListeningToMultiControls, listenToMultiControls, stopListeningToQControls,
listenToQControls, categoryList, stopListeningToRControls, M,
listenToRControls, listenToImgInputs, listenToImgPreview, setSelectValue */

function returnHtml(params) {

    const buildMultiControlHtml = (mId, init) => {
        if (isNaN(mId)) {
            return 'Error: Missing/invalid mId';
        }
        let removeControlHtml = `
        <a href="#!" class="multi-control-remove light-blue-text ` +
            `text-darken-4">-</a>`;
        let addControlHtml = `
        <a href="#!" class="multi-control-add light-blue-text ` +
            `text-darken-4">+</a>`;
        let controlHtml = '';
        if (mId === 2 && !init) {
            controlHtml = addControlHtml;
        } else if (mId > 2) {
            controlHtml = removeControlHtml + addControlHtml.trim();
        }

        return controlHtml;
    };

    const buildMultiHtml = (rId, qId, mId, init) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId';
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId';
        }
        if (isNaN(mId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid mId';
        }
        if (err.length > 0) {
            return err;
        }
        // let removeControlHtml = `
        // <a href="#!" class="multi-control-remove light-blue-text ` +
        //     `text-darken-4">-</a>`;
        // let addControlHtml = `
        // <a href="#!" class="multi-control-add light-blue-text ` +
        //     `text-darken-4">+</a>`;
        // let controlHtml = '';
        // if (mId === 2 && !init) {
        //     controlHtml = addControlHtml;
        // } else if (mId > 2) {
        //     controlHtml = removeControlHtml + addControlHtml.trim();
        // }
        let controlHtml = buildMultiControlHtml(mId, init);

        let answerHtml = `
        <div class="input-field multi-input col s10">
            <span class="prefix center-align" data-question="${qId}"` +
                `data-multi="${mId}">
                ${controlHtml}` +
            `</span>
            <input id="answer_${rId}_${qId}_${mId}" ` +
                `name="answer_${rId}_${qId}_${mId}" ` +
                `type="text" minlength="1" maxlength="100" ` +
                `class="validate" value="" required>
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
                    `type="checkbox"/>
                <span></span>
            </label>
        </div>
        <!-- Optional Image URL -->
        <div class="input-field multi-input col s12">
            <span class="prefix light-blue-text text-darken-4 ` +
                `center-align"></span>
            <input id="a_img_${rId}_${qId}_${mId}" ` +
                `name="a_img_${rId}_${qId}_${mId}" ` +
                `type="url" class="img-url validate" value="">
            <label for="a_img_${rId}_${qId}_${mId}" data-error="Invalid URL" ` +
                `data-default="Optional Image URL">` +
                `Optional Image URL</label>
        </div>
        <div class="image-preview col s12 center-align"></div>`;

        return answerHtml;
    };

    const toggleMultiHtml = (rId, qId, checked) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId';
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId';
        }
        if (typeof checked !== 'boolean' ||
            (checked !== true && checked !== false)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid checked state';
        }
        if (err.length > 0) {
            return err;
        }
        let mId = 0;
        let htmlTitle = '';
        let htmlContent = '';
        if (checked === true) {
            mId = 1;
            htmlTitle = `<span class="col s10">What are the Choices?</span>` +
                `<span class="col s2 center-align">Correct?</span>`;
            const initMultiHtml = () => {
                htmlContent += buildMultiHtml(rId, qId, mId, true);
                if (mId < 3) {
                    mId += 1;
                    initMultiHtml();
                }
            };

            initMultiHtml();

            return {htmlTitle, htmlContent, 'multiCount': mId};

        }
        htmlTitle = `<span class="col s12">What is the Answer?</span>`;
        htmlContent = `
        <div class="input-field col s12">
            <span class="prefix" data-question="${qId}" ` +
                `data-multi="0"></span>
            <input id="answer_${rId}_${qId}" name="answer_${qId}" ` +
                `type="text" minlength="1" maxlength="100" ` +
                `class="validate" value="" required>
            <label for="answer_${rId}_${qId}" ` +
                `data-error="Invalid Answer" ` +
                `data-default="Answer ${rId}_${qId}">Answer ${rId}_${qId}` +
                `</label>
        </div>
        <!-- Optional Image URL -->
        <div class="input-field col s12">
            <span class="prefix light-blue-text text-darken-4 ` +
                `center-align"></span>
            <input id="a_img_${rId}_${qId}" name="a_img_${rId}_${qId}" ` +
                `type="url" class="img-url validate" value="">
            <label for="a_img_${rId}_${qId}" data-error="Invalid URL" ` +
                `data-default="Optional Image URL">` +
                `Optional Image URL</label>
        </div>
        <div class="image-preview col s12 center-align"></div>`;

        return {htmlTitle, htmlContent, 'multiCount': mId};
    };

    const buildQControlHtml = (qId) => {
        if (isNaN(qId)) {
            return 'Error: Missing/invalid mId';
        }
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
        if (qId === 1) {
            qControlHtml = `
                <div class="qcontrols col s2 right-align">
                    <a href="#!" ` +
                        `class="qcontrols-add light-blue-text ` +
                            `text-darken-4">+</a>
                </div>`;
        }

        return qControlHtml;
    };

    const buildQHtml = (rId, qId) => {
        let err = '';
        if (isNaN(rId)) {
            err = 'Error: Missing/invalid rId';
        }
        if (isNaN(qId)) {
            if (err.length > 0) {
                err += `\n`;
            }
            err += 'Error: Missing/invalid qId';
        }
        if (err.length > 0) {
            return err;
        }
        // let qControlHtml = `
        //         <div class="qcontrols col s2 right-align">
        //             <a href="#!" ` +
        //                 `class="qcontrols-remove light-blue-text ` +
        //                     `text-darken-4">` +
        //                 `-</a>
        //             <a href="#!" ` +
        //                 `class="qcontrols-add light-blue-text ` +
        //                     `text-darken-4">+</a>
        //         </div>`;
        // if (init) {
        //     qControlHtml = `
        //         <div class="qcontrols col s2 right-align">
        //             <a href="#!" ` +
        //                 `class="qcontrols-add light-blue-text ` +
        //                     `text-darken-4">+</a>
        //         </div>`;
        // }
        let qControlHtml = buildQControlHtml(qId);

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
                    <div class="input-field col s12">
                        <span class="prefix light-blue-text text-darken-4 ` +
                            `center-align"></span>
                        <input id="question_${rId}_${qId}" ` +
                            `name="question_${rId}_${qId}" ` +
                            `type="text" minlength="5" maxlength="25" ` +
                            `class="validate" value="" required>
                        <label for="question_${rId}_${qId}" ` +
                            `data-error="Invalid Question" ` +
                            `data-default="Question ${qId}">` +
                            `Question ${qId}</label>
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
                                    `data-default="Answer ${qId}">` +
                                    `Answer ${qId}</label>
                        </div>
                        <!-- Optional Image URL -->
                        <div class="input-field col s12">
                            <span class="prefix light-blue-text ` +
                                `text-darken-4 ` +
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

        return qHtml;
    };

    const buildRControlHtml = (rId) => {
        if (isNaN(rId)) {
            return 'Error: Missing/invalid rId';
        }
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

        if (rId === 1) {
            rControlHtml = `
            <div class="rcontrols col s2 right-align">
                <a href="#!" ` +
                    `class="rcontrols-add light-blue-text ` +
                    `text-darken-4">` +
                    `+</a>
            </div>`;
        }

        return rControlHtml;
    };

    const buildRHtml = (rId) => {
        if (isNaN(rId)) {
            return 'Error: Missing/invalid rId';
        }
        let rHtml = `
            <li>
                <div class="collapsible-header round-title" data-round="${rId}">
                    Round ${rId}
                    <svg class="caret" height="32" viewBox="0 0 24 24" ` +
                            `width="32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 10l5 5 5-5z"></path>
                        <path d="M0 0h24v24H0z" fill="none"></path>
                    </svg>`;
                    // `
                    // <div class="rcontrols col s2 right-align">
                    //     <a href="#!" ` +
                    //         `class="rcontrols-remove light-blue-text ` +
                    //             `text-darken-4">` +
                    //         `-</a>
                    //     <a href="#!" ` +
                    //         `class="rcontrols-add light-blue-text ` +
                    //         `text-darken-4">` +
                    //         `+</a>
                    // </div>` +
        let rControlHtml = buildRControlHtml(rId);
        rHtml += rControlHtml +
                    `
                </div>
                <div class="collapsible-body">
                    <div class="row round-row">
                        <span class="title col xl12 hide-on-large-and-down">
                            Choose a Category and Provide a Title for this Round
                        </span>
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
                        <div class="input-field col s12 xl7 ">
                            <input id="roundTitle_${rId}" ` +
                                `name="round_title_${rId}" type="text" ` +
                                `minlength="5" maxlength="25" ` +
                                `class="validate" ` +
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
                                <li class="active">`;

        let qHtml = buildQHtml(rId, 1);
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
        rHtml += qHtml;
        rHtml += `
                            </ul>
                        </div>
                    </div>
                </div>
            </li>
        `;

        return rHtml;
    };

    const preloader = () => {
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

        return preloaderHtml;
    };

    const imgPreviewHtml = (imgUrl) => {
        let imgPreviewHtml = `<img class="hidden" src="${imgUrl}" ` +
                `alt="Image Preview"></img>`;

        return imgPreviewHtml;
    };

    const validateParams = () => {
        if (!Object.prototype.hasOwnProperty.call(params, 'request')) {
            return 'Missing request parameter';
        }
        let html;
        switch (params.request) {
        case 'toggleMulti':
            html = toggleMultiHtml(params.rId, params.qId, params.checked);
            break;
        case 'multiControl':
            html = buildMultiControlHtml(params.mId);
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

        return html;
    };

    let result = validateParams();

    return result;
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
    let mId = parseInt(prefix.attr('data-multi')) + 1;

    prefix.html("");
    let request = 'addMulti';
    let answerHtml = returnHtml({request, rId, qId, mId});

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
    let mId = parseInt(prefix.attr('data-multi')) - 1;
    let inputField = prefix.closest('.input-field');
    let checkboxContainer = inputField.next();
    let imgInputContainer = checkboxContainer.next();
    let imgPreviewContainer = imgInputContainer.next();
    let answersContainer = inputField.closest('.answers-container');
    let multiCount = parseInt($(answersContainer).prev().
        val()) - 1;
    let prevMulti = $(`.prefix[data-multi="${mId}"]`, answersContainer);
    let request = 'multiControl';
    let controlHtml = returnHtml({request, mId});

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
    let request = 'toggleMulti';
    let checked = $(elem).prop('checked');
    let html = returnHtml({request, rId, qId, checked});

    targetTitle.html(html.htmlTitle);
    targetField.html(html.htmlContent);
    $(`#multiCount_${rId}_${qId}`).val(html.multiCount);
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
    let request = 'addQ';
    let html = returnHtml({request, rId, qId});

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
    let request = 'qControl';
    let qControlsHtml = returnHtml({request, qId});

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
    let request = 'addR';
    let html = returnHtml({request, rId});

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
    let request = 'rControl';
    let rControlsHtml = returnHtml({request, rId});

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
    let request = 'preloader';
    let html = returnHtml({request});
    $(elem).append(html);
}

// eslint-disable-next-line no-unused-vars
function imgPreview(imgUrl, target) {
    if (imgUrl.length === 0) {
        target.html('');
        return;
    }
    let request = 'imgPreview';
    $(target).html(returnHtml({request, imgUrl}));
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