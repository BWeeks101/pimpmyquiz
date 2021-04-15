/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global roleList, userList, categoryList, observerList, xHttpRequest, M,
checkBoxMulti, removeQAction, removeRoundAction, deleteQuiz */

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
        let controlHtml = buildMultiControlHtml(mId, init);

        let answerHtml = `
        <div class="input-field multi-input col s10">
            <span class="prefix center-align" data-question="${qId}"` +
                `data-multi="${mId}">
                ${controlHtml}` +
            `</span>
            <input id="answer_${rId}_${qId}_${mId}" ` +
                `name="answer_${rId}_${qId}_${mId}" ` +
                `type="text" minlength="1" maxlength="255" ` +
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
            <input id="answer_${rId}_${qId}" name="answer_${rId}_${qId}" ` +
                `type="text" minlength="1" maxlength="255" ` +
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
                            `type="text" minlength="5" maxlength="255" ` +
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
                                `type="text" minlength="1" maxlength="255" ` +
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
                                `minlength="5" maxlength="100" ` +
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

function getObserver(elem) {
    let observer = observerList.find((obj) => obj.elem === elem);
    if (observer !== undefined) {
        return observer.obs;
    }
    return observer;
}

// eslint-disable-next-line no-unused-vars
function stopObserver(elem) {
    let observer = getObserver(elem);
    observer.disconnect();
}

// eslint-disable-next-line no-unused-vars
function addObserver(elem, func) {
    let observer = getObserver(elem);
    if (observer === undefined) {
        observerList.push({
            elem,
            'obs': new MutationObserver(func)
        });
    }
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

let titleValidationInProgress = false;

// eslint-disable-next-line no-unused-vars
function quizTitleValidate(invalid, valid) {
    if (titleValidationInProgress) {
        return;
    }
    titleValidationInProgress = true;
    const setQuizTitleLabel = (dataAttr) => {

        if (!$('#quizTitle ~ label').attr(`data-${dataAttr}`)) {
            console.log(`Error: data attr (data-${dataAttr}) does not exist`);
            return;
        }

        const setValidationClass = (valid) => {
            if (!valid) {
                $('#quizTitle').removeClass("valid");
                $('#quizTitle').addClass("invalid");
                return;
            }
            $('#quizTitle').removeClass("invalid");
            $('#quizTitle').addClass("valid");
        };

        const updLabelText = () => {
            $('#quizTitle ~ label').
                html($('#quizTitle ~ label').
                    data(dataAttr));
        };

        const enableSubmitButton = (enabled) => {
            if ($('#modalSubmitButton').length) {
                if (!enabled) {
                    $('#modalSubmitButton').attr('disabled', true);
                    return;
                }
                $('#modalSubmitButton').attr('disabled', false);
            }
        };

        switch (dataAttr) {
        case 'error':
        case 'dup':
            setValidationClass(false);
            updLabelText();
            enableSubmitButton(false);
            break;
        case 'default':
            setValidationClass(true);
            updLabelText();
            enableSubmitButton(true);
            break;
        default:
        }
    };

    let quizTitle = $('#quizTitle').val().
        trim();
    if (quizTitle.length < 5 || quizTitle.length > 100) {
        setQuizTitleLabel('error');
        if (invalid) {
            invalid(quizTitle);
        }
        titleValidationInProgress = false;
        return false;
    }

    let request = {
        'type':
            'validate_quiz_title',
        'params': {
            quizTitle
        }
    };
    if ($('#quizTitle').attr('data-id')) {
        request.params.id = $('#quizTitle').attr('data-id');
    }
    let xhttp = xHttpRequest(request);
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            if (xhttp.responseText === 'false') {
                setQuizTitleLabel('dup');
                if (invalid) {
                    invalid(quizTitle);
                }
                titleValidationInProgress = false;
                return false;
            }

            setQuizTitleLabel('default');
            if (valid) {
                valid(quizTitle);
            }
            titleValidationInProgress = false;
            return true;
        }
    };
}

// eslint-disable-next-line no-unused-vars
function listenToQuizTitle() {
    $('#quizTitle').on("focusout keyup input", (e) => {
        if ((e.type === 'keyup' && e.key !== 'Enter') || (e.type === 'input')) {
            setTimeout(function() {
                quizTitleValidate();
            }, 1000);
            return;
        }
        quizTitleValidate();
    });
}

// eslint-disable-next-line no-unused-vars
function imgPreviewLoad(elem, max) {
    let img = {
        'height': $(elem).height(),
        'width': $(elem).width()
    };

    if (max === undefined || max > parseInt($(elem).css('max-width'))) {
        max = parseInt($(elem).css('max-width'));
    }
    let val;
    let maxPrint = 50;
    let printVal;
    let style;
    if (img.width === img.height) {
        val = max;
        printVal = maxPrint;
        $(elem).height(val);
    } else if (img.width > img.height) {
        val = (max / 100) * ((img.height / img.width) * 100);
        printVal = (maxPrint / 100) * ((img.height / img.width) * 100);
        style = `@media print {height: ${printVal}mm}`;
        $(elem).height(val);

    } else {
        val = (max / 100) * ((img.width / img.height) * 100);
        printVal = (maxPrint / 100) * ((img.width / img.height) * 100);
        style = `@media print {width: ${printVal}mm}`;
        $(elem).width(val);
    }
    $(elem).attr('style', style);
    $(elem).next().
        remove();
    $(elem).removeClass('hidden');
}

// eslint-disable-next-line no-unused-vars
function imgPreviewError(elem, errText) {
    $(elem).next().
        remove();
    $(elem).removeClass('hidden');
    $(elem).attr('alt', errText);
    $(elem).attr('style', "padding: 10px; border: solid 1px black");
}

let removeActionParams;

// eslint-disable-next-line no-unused-vars
function popChangeConfModal(type, elem) {
    let title;
    let message;
    switch (type) {
    case 'mu':
        title = 'Confirmation Required';
        message = 'If you disable multiple choice, all existing multiple ' +
        'choice options for this question will be deleted.  Do you wish to ' +
        'continue?';
        break;
    case 'mc':
        title = 'Confirmation Required';
        message = 'If you enable multiple choice, existing answer data for ' +
        'this question will be deleted.  Do you wish to continue?';
        break;
    case 'q':
        title = 'Confirmation Required';
        message = 'Are you sure you wish to delete this question?';
        break;
    case 'r':
        title = 'Confirmation Required';
        message = 'If you delete this round, all associated questions will ' +
        'also be deleted.  Do you wish to continue?';
        break;
    case 'd':
        title = 'Confirmation Required';
        message = 'If you delete this quiz, all associated rounds and ' +
        'questions will also be deleted.  Do you wish to continue?';
        break;
    case 'c':
        title = 'Confirmation Required';
        message = 'All unsaved changes will be lost.  Do you wish to continue?';
        break;
    default:
        return;
    }
    $('#modalTitle').html(title);
    $('#modalMessage').html(message);

    removeActionParams = {type, elem};

    let instance = M.Modal.
        getInstance(document.querySelector('#changeConfModal'));
    instance.open();
}

// eslint-disable-next-line no-unused-vars
function removeAction({type, elem}) {
    switch (type) {
    case 'mu':
    case 'mc':
        checkBoxMulti(elem);
        break;
    case 'q':
        removeQAction(elem);
        break;
    case 'r':
        removeRoundAction(elem);
        break;
    case 'd':
        deleteQuiz($(elem).attr('data-quizId'));
        break;
    case 'c':
        window.location.href = $(elem).attr('href');
        break;
    default:
    }
}

// eslint-disable-next-line no-unused-vars
function initChangeConfModal() {
    const resetModal = () => {
        // eslint-disable-next-line no-unused-vars
        removeActionParams = "";
        $('#modalTitle').html("");
        $('#modalMessage').html("");
    };

    M.Modal.init(document.querySelector('#changeConfModal'), {
        onCloseEnd: resetModal,
        preventScrolling: true
    });
}

// eslint-disable-next-line no-unused-vars
function listenToChangeConfModalButtons() {
    const modalClose = () => {
        let instance = M.Modal.
        getInstance(document.querySelector('#changeConfModal'));
        instance.close();
    };

    $('#modalYesButton').on("click", () => {
        modalClose();
        removeAction(removeActionParams);
    });


    $('#modalNoButton').on("click", () => {
        modalClose();
        switch (removeActionParams.type) {
        case 'mu':
            $(removeActionParams.elem).prop('checked', true);
            break;
        case 'mc':
            $(removeActionParams.elem).prop('checked', false);
            break;
        default:
        }
    });
}

//document ready
$(function() {
    $('.sidenav').sidenav({edge: "right"});
});