/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global addObserver, getObserver, stopObserver, stopListeningToSelect,
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

function reinitSelectOnDisabled(elem) {
    $(elem).each((i, el) => {
        const observerFunc = () => {
            stopListeningToSelect();
            $(el).formSelect();
            listenToSelect();
        };
        addObserver(el, observerFunc);
        let observer = getObserver(el);
        observer.observe(el, {attributeFilter: ['disabled']});
    });
}

function validateCorrectCheckboxes(elem) {
    let container = $(elem).closest('.answers-container');
    let checked = $(container).find('.correct:checked');
    let unchecked = $(container).find('.correct:not(:checked)');
    if (!$(checked).length || !$(unchecked).length) {
        $(container).find('.checkbox-container>label').
            removeClass('valid').
                addClass('invalid');
        return;
    }
    $(unchecked).parent().
        removeClass('valid').
            removeClass('invalid');
    $(checked).parent().
        removeClass('invalid').
            addClass('valid');
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
    let multiContainer = $(`#answer_${rId}_${qId}_${mId}`).
        closest('.multi-container');
    // stopListeningToQuizInputHelpers(answersContainer);
    listenToQuizInputHelpers(multiContainer);
    // stopListeningToQuizInputs(answersContainer);
    listenToQuizInputs(multiContainer);
    // stopListeningToImgInputs();
    // listenToImgInputs();
    // stopListeningToCorrectCheckboxes(answersContainer);
    listenToCorrectCheckboxes(multiContainer);
    let checkbox = $(`#correct_${rId}_${qId}_${mId}`);
    validateCorrectCheckboxes($(checkbox)[0]);
}

// eslint-disable-next-line no-unused-vars
function removeMulti(elem) {
    let rId = parseInt($(elem).closest('.collapsible').
        closest('.collapsible-body').
            prev().
                attr('data-round'));
    let prefix = $(elem).closest('.prefix');
    let qId = parseInt(prefix.attr('data-question'));
    let mId = parseInt(prefix.attr('data-multi')) - 1;
    let multiContainer = $(elem).closest('.multi-container');
    // let inputField = prefix.closest('.input-field');
    // let checkboxContainer = inputField.next();
    // let imgInputContainer = checkboxContainer.next();
    // let imgPreviewContainer = imgInputContainer.next();
    // let answersContainer = inputField.closest('.answers-container');
    let answersContainer = multiContainer.closest('.answers-container');
    let multiCount = parseInt($(answersContainer).prev().
        val()) - 1;
    let prevMulti = $(`.prefix[data-multi="${mId}"]`, answersContainer);
    let request = 'multiControl';
    let controlHtml = returnHtml({request, mId});

    stopListeningToMultiControls();
    prevMulti.html(controlHtml);

    // inputField.remove();
    // checkboxContainer.remove();
    // imgInputContainer.remove();
    // imgPreviewContainer.remove();
    stopListeningToQuizInputHelpers(multiContainer);
    stopListeningToQuizInputs(multiContainer);
    // stopListeningToImgInputs();
    stopListeningToCorrectCheckboxes(multiContainer);
    multiContainer.remove();
    // listenToQuizInputHelpers(answersContainer);
    // listenToQuizInputs(answersContainer);
    // listenToImgInputs();
    // listenToCorrectCheckboxes(answersContainer);
    $(answersContainer).prev().
        val(multiCount);
    listenToMultiControls();
    let checkbox = $(`#correct_${rId}_${qId}_${mId}`);
    validateCorrectCheckboxes($(checkbox)[0]);
}

// eslint-disable-next-line no-unused-vars
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
    stopListeningToMultiControls();
    stopListeningToQuizInputHelpers(targetField);
    stopListeningToQuizInputs(targetField);
    // stopListeningToImgInputs();
    stopListeningToCorrectCheckboxes(targetField);
    targetTitle.html(html.htmlTitle);
    targetField.html(html.htmlContent);
    $(`#multiCount_${rId}_${qId}`).val(html.multiCount);
    listenToMultiControls();
    listenToQuizInputHelpers(targetField);
    listenToQuizInputs(targetField);
    // listenToImgInputs();
    listenToCorrectCheckboxes(targetField);
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
    // stopListeningToImgInputs();
    $(qControls).remove();
    $(target).append(html);
    $(`#questionCount_${rId}`).val(questionCount);
    listenToQControls();
    listenToCheckbox();
    let questionContainer = $(target).
        find(`.collapsible-header[data-question=${qId}]`).
            next();
    listenToQuizInputHelpers(questionContainer);
    listenToQuizInputs(questionContainer);
    // listenToImgInputs();

    // $(target).children('li').
    //     children(`.collapsible-header[data-question="${qId - 1}"]`).
    //         parent().
    //             removeClass('active');
    // $(target).children('li').
    //     children(`.collapsible-header[data-question="${qId - 1}"]`).
    //         next().
    //             css('display', "");
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId}"]`).
            parent().
                addClass('active');
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId}"]`).
            next().
                css('display', 'block');
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId}"]`)[0].
            scrollIntoView();
}

// eslint-disable-next-line no-unused-vars
function removeQ(elem) {
    popChangeConfModal('q', elem);
}

// eslint-disable-next-line no-unused-vars
function removeQAction(elem) {
    let rId = parseInt($(elem).closest('.collapsible-body').
        prev().
        attr('data-round'));
    let questionCount = parseInt($(`#questionCount_${rId}`).val()) - 1;
    let qId = parseInt($(elem).closest('.collapsible-header').
        attr('data-question')) - 1;
    let target = $(elem).closest('li');
    let prevQ = $(target).prev();
    let qControlsTarget = $(`#question_${rId}_${qId}`).
        closest('.collapsible-body').
            prev();
    let request = 'qControl';
    let qControlsHtml = returnHtml({request, qId});

    stopListeningToQControls();
    stopListeningToCheckbox();
    let questionContainer = $(elem).closest('.collapsible-header').
        next();
    stopListeningToQuizInputHelpers(questionContainer);
    stopListeningToQuizInputs(questionContainer);
    stopListeningToCorrectCheckboxes(questionContainer);
    // stopListeningToImgInputs();
    $(target).remove();
    $(`#questionCount_${rId}`).val(questionCount);
    $(qControlsTarget).append(qControlsHtml);
    listenToQControls();
    listenToCheckbox();
    // listenToImgInputs();
    // listenToCorrectCheckboxes();

    $(prevQ).addClass('active');
    $(prevQ).
        children(`.collapsible-header[data-question="${qId}"]`).
            next().
                css('display', 'block');
    $(prevQ).
        children(`.collapsible-header[data-question="${qId}"]`)[0].
            scrollIntoView();
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
    $('.collapsible.helper-collapsible').collapsible();
    $('.collapsible.expandable').collapsible({accordion: false});
    $(`#roundTitle_${rId}`).
        on("input", (e) => inputValidation(e.currentTarget));
    listenToRControls();
    listenToQControls();
    listenToCheckbox();
    let roundContainer = $(target).
        find(`.collapsible-header[data-round=${rId}]`).
            next();
    listenToQuizInputHelpers(roundContainer);
    listenToQuizInputs(roundContainer);
    stopListeningToSelect();
    $('select').formSelect();
    listenToSelect();
    setSelectValue($(`#roundCategory_${rId}`), quizCategory.toLowerCase());
    reinitSelectOnDisabled($(`#roundCategory_${rId}`));
    if (quizCategory.toLowerCase() !== 'general knowledge') {
        $(`#roundCategory_${rId}`).attr('disabled', true);
    }
    // stopListeningToImgInputs();
    // listenToImgInputs();

    // $(target).children('li').
    //     children(`.collapsible-header[data-round="${rId - 1}"]`).
    //     parent().
    //     removeClass('active');
    // $(target).children('li').
    //     children(`.collapsible-header[data-round="${rId - 1}"]`).
    //     next().
    //     css('display', "");
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId}"]`).
        parent().
        addClass('active');
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId}"]`).
        next().
        css('display', 'block');
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId}"]`)[0].
        scrollIntoView();
}

// eslint-disable-next-line no-unused-vars
function removeRound(elem) {
    popChangeConfModal('r', elem);
}

// eslint-disable-next-line no-unused-vars
function removeRoundAction(elem) {
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
    let roundContainer = $(elem).closest('.collapsible-header').
        next();
    stopListeningToQuizInputHelpers(roundContainer);
    stopListeningToQuizInputs(roundContainer);
    // stopListeningToImgInputs();
    stopListeningToCorrectCheckboxes(roundContainer);
    $(`#roundTitle_${rId}`).off('input');
    $(target).remove();
    $('#roundCount').val(rCount);
    $(rControlsTarget).append(rControlsHtml);
    listenToRControls();
    $('select').formSelect();
    listenToSelect();
    listenToQControls();
    listenToCheckbox();
    // listenToImgInputs();
    // listenToCorrectCheckboxes();

    $(prevR).addClass('active');
    $(prevR).
        children(`.collapsible-header[data-round="${rId}"]`).
            next().
                css('display', 'block');
    $(prevR).
        children(`.collapsible-header[data-round="${rId}"]`)[0].
            scrollIntoView();
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
    listenToImgPreview(target.children('img'));
}

function getPairedHelperState(helperCollapsibleA, helperCollapsibleB) {
    let a = 0;
    let b = 0;
    let p = 0;

    if ($(helperCollapsibleA).find('li:not(.paired)').
            hasClass('active')) {
        a = 1;
    }

    if ($(helperCollapsibleB).find('li').
            hasClass('active')) {
        b = 1;
    }

    if ($(helperCollapsibleA).find('li.paired').
            hasClass('active')) {
        p = 1;
    }

    return a.toString() + b.toString() + p.toString();
}

function getPairedInputState(inputA, inputB) {
    let a = -1;
    let b = -1;
    if ($(inputA).hasClass('valid') && !$(inputA).hasClass('invalid')) {
        a = 1;
    } else if ($(inputA).hasClass('invalid') && !$(inputA).hasClass('valid')) {
        a = 0;
    }

    if ($(inputB).hasClass('valid') && !$(inputB).hasClass('invalid')) {
        b = 1;
    } else if ($(inputB).hasClass('invalid') && !$(inputB).hasClass('valid')) {
        b = 0;
    }

    return a.toString() + b.toString();
}

function setHelperState(newState, currentState) {
    if (newState === currentState.state) {
        return;
    }

    switch (newState) {
    case '001':
        openInputHelper(currentState.a, 1);
        closeInputHelper(currentState.b);
        break;
    case '000':
        closeInputHelper(currentState.a, 0);
        closeInputHelper(currentState.a, 1);
        closeInputHelper(currentState.b);
        break;
    case '100':
        openInputHelper(currentState.a, 0);
        closeInputHelper(currentState.b);
        break;
    case '010':
        closeInputHelper(currentState.a, 0);
        closeInputHelper(currentState.a, 1);
        openInputHelper(currentState.b);
        break;
    }
}

function setPairedHelperState(inputState, helperState) {
    let newState;
    switch (inputState) {
    case '-1-1':
        newState = '001';
        break;
    case '-10':
        newState = '001';
        break;
    case '-11':
        newState = '000';
        break;
    case '0-1':
        newState = '001';
        break;
    case '00':
        newState = '001';
        break;
    case '01':
        newState = '100';
        break;
    case '1-1':
        newState = '000';
        break;
    case '10':
        newState = '010';
        break;
    case '11':
        newState = '000';
        break;
    }

    // console.log(inputState);
    // console.log(newState);
    // console.log(helperState.state);

    setHelperState(newState, helperState);
}

function inputValidatePair (inputA, inputB) {
    let helperA = getInputHelper(inputA);
    let helperB = getInputHelper(inputB);
    let helperState = {
        'state': getPairedHelperState(helperA.el, helperB.el),
        'a': helperA,
        'b': helperB
    };
    let inputState = getPairedInputState(inputA, inputB);

    setPairedHelperState(inputState, helperState);
}

// eslint-disable-next-line no-unused-vars
function checkImgUrl(elem, skipInputValidation = false) {
    let input = $(elem).parent().
            prev().
                prev();
    if ($(elem).parent().
            hasClass('multi-input')) {
        input = $(input).prev();
    }
    input = $(input).children('input[type="text"]');
    if (!$(input).length) {
        return false;
    }

    if ($(elem).val().
            trim().length === 0) {
        $(elem).removeClass("invalid").
            removeClass("valid");

        $(input).prop('required', true);

        if (!skipInputValidation) {
            inputValidation(input, true);
        }
        inputValidatePair(input, elem);
        return true;
    } else if ($(elem).hasClass('invalid')) {
        $(input).prop('required', true);
        // $(input).prop('required', true).
        //     removeClass('invalid').
        //         removeClass('valid');

        if (!skipInputValidation) {
            inputValidation(input, true);
        }
        inputValidatePair(input, elem);
        return true;
    }

    $(input).prop('required', false);
    if ($(input).val().
            trim().length === 0) {
        $(input).removeClass('invalid').
            removeClass('valid');
    }

    if (!skipInputValidation) {
        inputValidation(input, true);
    }
    inputValidatePair(input, elem);
    return true;
}

function buildValidationMap(form) {
    let selector = 'input:not(.hidden, .select-dropdown), ' +
        'div[data-round], div[data-question]';
    let inputs = $(form).find(selector);

    let quiz = {'rounds': []};
    let i = 0;
    let roundElems = {};
    let questionElems = {};
    let answerElems = {};
    let optionElems = {};
    let breakRloop = false;
    let breakQloop = false;
    let breakOloop = false;

    const buildOptionElems = (i) => {
        const scanOptions = (i) => {
            if ($(inputs[i]).hasClass('option') ||
                    $(inputs[i]).attr('data-question') ||
                        $(inputs[i]).attr('data-round')) {
                breakOloop = true;
            } else if ($(inputs[i]).hasClass('correct')) {
                optionElems.correct = inputs[i];
            } else if ($(inputs[i]).hasClass('img-url') &&
                        $(inputs[i]).
                            closest('.multi-input').length) {
                optionElems.oImg = inputs[i];
            }

            if (breakOloop === false) {
                i += 1;
            }

            if (i > inputs.length - 1) {
                breakOloop = true;
            }

            if (breakOloop === true) {
                if (!answerElems.options) {
                    answerElems.options = [];
                }
                answerElems.options.push(optionElems);
                optionElems = {};
                return i;
            }
            return scanOptions(i);
        };

        optionElems.answer = inputs[i];
        i += 1;
        i = scanOptions(i);
        return i;
    };

    const buildQuestionElems = (i) => {
        const scanQuestions = (i) => {
            if ($(inputs[i]).attr('data-question') ||
                    $(inputs[i]).attr('data-round')) {
                breakQloop = true;
            } else if ($(inputs[i]).hasClass('question')) {
                questionElems.question = inputs[i];
            } else if ($(inputs[i]).hasClass('img-url') &&
                    !$(inputs[i]).
                        closest('.answers-container').length) {
                questionElems.qImg = inputs[i];
            } else if ($(inputs[i]).hasClass('quizMulti')) {
                questionElems.quizMulti = inputs[i];
            } else if ($(inputs[i]).hasClass('answer')) {
                answerElems.answer = inputs[i];
            } else if ($(inputs[i]).hasClass('img-url') &&
                    !$(inputs[i]).
                        closest('.multi-input').length &&
                    $(inputs[i]).
                        closest('.answers-container').length) {
                answerElems.aImg = inputs[i];
            } else if ($(inputs[i]).hasClass('option')) {
                i = buildOptionElems(i);
            }

            if (breakQloop === false && breakOloop === false) {
                i += 1;
            }

            if (breakOloop === true) {
                breakOloop = false;
            }

            if (i > inputs.length - 1) {
                breakQloop = true;
            }

            if (breakQloop === true) {
                questionElems.answer = answerElems;
                answerElems = {};
                roundElems.questions.push(questionElems);
                questionElems = {};
                return i;
            }
            return scanQuestions(i);
        };

        questionElems.header = inputs[i];
        i += 1;
        i = scanQuestions(i);
        return i;
    };

    const buildRoundElems = (i) => {
        const scanRounds = (i) => {
            if ($(inputs[i]).attr('data-round')) {
                breakRloop = true;
            } else if ($(inputs[i]).hasClass('round-title')) {
                roundElems.title = inputs[i];
            } else if ($(inputs[i]).attr('data-question')) {
                i = buildQuestionElems(i);
            }

            if (breakRloop === false && breakQloop === false) {
                i += 1;
            }

            if (breakQloop === true) {
                breakQloop = false;
            }

            if (i > inputs.length - 1) {
                breakRloop = true;
            }

            if (breakRloop === true) {
                quiz.rounds.push(roundElems);
                roundElems = {};
                return i;
            }

            return scanRounds(i);
        };

        roundElems.header = inputs[i];
        roundElems.questions = [];
        i += 1;
        breakRloop = false;
        breakQloop = false;
        breakOloop = false;
        i = scanRounds(i);

        return i;
    };

    const buildQuiz = (i) => {
        if ($(inputs[i]).attr('data-round')) {
            i = buildRoundElems(i);
            if (i < inputs.length - 1) {
                return buildQuiz(i);
            }
        }

        if (i < inputs.length - 1) {
            i += 1;
            return buildQuiz(i);
        }
    };

    quiz.title = $('.quiz-title')[0];
    buildQuiz(i);
    inputs = undefined;

    return quiz;
}

// eslint-disable-next-line no-unused-vars
function quizFormValidation() {
    let quizForm = $('#createQuizForm')[0];
    if ($('#quizTitle').attr('data-id')) {
        quizForm = $('#editQuizForm')[0];
    }

    let validationMap = buildValidationMap($(quizForm));

    let valid = {
        'title': true,
        'elems': [],
        'rounds': [],
        'roundIds': []
    };

    const titleValidation = (titleInvalid) => {
        if (titleInvalid === true) {
            valid.title = validationMap.title;
            return;
        } else if (titleInvalid === false) {
            valid.title = true;
            return;
        }
        valid.title = titleInvalid;
    };

    const isInvalid = (elem) => {
        if ($(elem).prop('type') === 'checkbox' &&
                    $(elem).hasClass('correct')) {
            if ($(elem).parent().
                    hasClass('invalid')) {
                if ($(elem).prop('checked')) {
                    return true;
                }
                return true;
            }
            return false;
        }

        if (!$(elem).hasClass('valid') &&
                !$(elem).hasClass('invalid') &&
                    $(elem).attr('required')) {
            $(elem).addClass('invalid');
            if ($(elem).hasClass('quiz-title')) {
                const callback = () => {
                    titleValidation(isInvalid(validationMap.title));
                };

                quizTitleValidate(callback, callback, true);
                return 'pending';
            }
            inputValidation(elem, true);
        }

        if ($(elem).hasClass('invalid')) {
            return true;
        }

        if ($(elem).attr('required') &&
                $(elem).val().
                    trim().length === 0) {
            $(elem).removeClass('valid').
                addClass('invalid');
            inputValidation(elem, true);
            return true;
        }

        if ($(elem).attr('minlength') &&
                $(elem).val().
                    trim().length < $(elem).attr('minlength')) {
            $(elem).removeClass('valid').
                addClass('invalid');
            inputValidation(elem, true);
            return true;
        }

        if ($(elem).attr('maxlength') &&
                $(elem).val().
                    trim().length > $(elem).attr('maxlength')) {
            $(elem).removeClass('valid').
                addClass('invalid');
            inputValidation(elem, true);
            return true;
        }

        return false;
    };

    titleValidation(isInvalid(validationMap.title));

    validationMap.rounds.forEach((round) => {
        let roundData = {
            'id': undefined,
            'questions': []
        };
        let roundId = $(round.header).attr('data-round').
            toString();

        if (isInvalid(round.title)) {
            valid.elems.push(round.title);
            roundData.id = roundId;
        }

        round.questions.forEach((question) => {
            let qValid = true;
            if (isInvalid(question.question)) {
                valid.elems.push(question.question);
                qValid = false;
            }

            if (isInvalid(question.qImg)) {
                valid.elems.push(question.qImg);
                qValid = false;
            }

            if (question.answer.options) {
                validateCorrectCheckboxes($(question.answer.options[0].
                    correct));

                question.answer.options.forEach((option) => {
                    if (isInvalid(option.answer)) {
                        valid.elems.push(option.answer);
                        qValid = false;
                    }

                    if (isInvalid(option.oImg)) {
                        valid.elems.push(option.oImg);
                        qValid = false;
                    }

                    if (isInvalid(option.correct)) {
                        valid.elems.push(option.correct);
                        qValid = false;
                    }
                });

            } else {
                if (isInvalid(question.answer.answer)) {
                    valid.elems.push(question.answer.answer);
                    qValid = false;
                }

                if (isInvalid(question.answer.aImg)) {
                    valid.elems.push(question.answer.aImg);
                    qValid = false;
                }
            }

            if (qValid === false) {
                if (!roundData.id) {
                    roundData.id = roundId;
                }
                roundData.questions.push(
                    $(question.header).attr('data-question').
                        toString());
            }
        });

        if (roundData.id) {
            valid.rounds.push(roundData);
            valid.roundIds.push(roundData.id);
        }
    });

    const getHeaderInstance = (elem) => M.Collapsible.getInstance(elem);

    const collapseValid = () => {
        valid.rounds.forEach((round) => {
            let questionHeaderSelector;
            if (round.questions) {
                questionHeaderSelector = `.collapsible-header[data-round="` +
                    `${round.id}"]~.collapsible-body ` +
                        `.collapsible-header[data-question]`;
                $(questionHeaderSelector).each((i, elem) => {
                    let instance = getHeaderInstance(
                        $(elem).closest('.collapsible')[0]);

                    let qId = $(elem).attr('data-question').
                        toString();

                    if ($.inArray(qId, round.questions) === -1) {
                        instance.close(Number(qId) - 1);
                        return;
                    }
                    instance.open(Number(qId) - 1);
                });

            }

        });

        $('.collapsible-header[data-round]').each((i, elem) => {
            let instance = getHeaderInstance(
                $(elem).closest('.collapsible')[0]);

            let rId = $(elem).attr('data-round').
                toString();

            if ($.inArray(rId, valid.roundIds) === -1) {
                let qInstance = getHeaderInstance($(elem).next().
                    find('.collapsible-header[data-question]').
                        closest('.collapsible')[0]);
                qInstance.close();
                instance.close(Number(rId) - 1);
                return;
            }
            instance.open(Number(rId) - 1);
        });

    };

    const scrollToFirstInvalid = () => {
        let elem;
        if (valid.title !== true) {
            elem = $(valid.title).closest('.row').
                find('.helper-collapsible:visible');
        } else if (valid.elems) {
            if ($(valid.elems[0]).prop('type') !== 'checkbox') {
                if ($(valid.elems[0]).hasClass('round-title')) {
                    elem = $(valid.elems[0]).closest('.round-row').
                        find('.helper-collapsible:visible');
                } else if ($(valid.elems[0]).hasClass('question')) {
                    elem = $(valid.elems[0]).closest('.row').
                        find('.helper-collapsible li.active');
                } else if ($(valid.elems[0]).hasClass('answer')) {
                    elem = $(valid.elems[0]).closest('.answers-container').
                        find('.helper-collapsible li.active');
                } else if ($(valid.elems[0]).hasClass('option')) {
                    elem = $(valid.elems[0]).closest('.multi-container').
                        find('.helper-collapsible li.active');
                } else if ($(valid.elems[0]).hasClass('img-url')) {
                    elem = $(valid.elems[0]).parent().
                        parent().
                            find('.helper-collapsible li.active');
                }
            }
        }

        if (elem) {
            $(elem)[0].scrollIntoView();
        }
    };

    const quizIsValid = () => {
        if (valid.title === true &&
            !valid.elems.length &&
                !valid.rounds.length &&
                    !valid.roundIds.length) {
            return true;
        }
        return false;
    };

    const validationActions = () => {
        if (quizIsValid()) {
            $(quizForm).submit();
            return;
        }

        collapseValid();
        scrollToFirstInvalid();
        M.Modal.getInstance($('#formValidationModal')[0]).open();
    };

    if (valid.title === 'pending') {
        let titleValidationPending;
        const checkTitle = () => {
            if (valid.title !== 'pending') {
                clearInterval(titleValidationPending);
                if (valid.title !== true) {
                    setTimeout(() => {
                        validationActions();
                    }, 300);
                    return;
                }
                validationActions();
            }
        };
        titleValidationPending = setInterval(checkTitle, 500);
        return;
    } else if (valid.title !== true) {
        setTimeout(() => {
            validationActions();
        }, 300);
        return;
    }
    validationActions();
}

$(function() {
    initChangeConfModal();
    initFormValidationModal();
    $('.collapsible.helper-collapsible').collapsible();
    $('.collapsible.expandable').collapsible({accordion: false});
    $('select').formSelect();
    listenToChangeConfModalButtons();
    listenToCancelUrl();
    listenToCheckbox();
    listenToSelect();
    setSelectValue($('#quizCategory'), 'general knowledge');
    setSelectValue($('#roundCategory_1'), 'general knowledge');
    reinitSelectOnDisabled($('.round-category'));
    listenToRControls();
    listenToQControls();
    // listenToImgInputs();
    listenToQuizTitle();
    listenToSubmitButton();
});