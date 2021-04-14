/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global addObserver, getObserver, stopObserver, stopListeningToSelect,
listenToSelect, returnHtml, stopListeningToMultiControls, listenToMultiControls,
stopListeningToQControls, listenToQControls, stopListeningToRControls, M,
listenToRControls, listenToImgInputs, listenToImgPreview, setSelectValue,
listenToQuizTitle, listenToSubmitButton, listenToChangeConfModalButtons */

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

let removeActionParams;

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
    }
    $('#modalTitle').html(title);
    $('#modalMessage').html(message);

    removeActionParams = {type, elem};

    let instance = M.Modal.
        getInstance(document.querySelector('#changeConfModal'));
    instance.open();
}

function listenToCheckbox() {
    $('input[type="checkbox"].quizMulti').on('change', (e) => {
        let self = e.currentTarget;
        if (!$(self).prop('checked')) {
            popChangeConfModal('mu', self);
            return;
        }
        popChangeConfModal('mc', self);
    });
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

    $(target).children('li').
        children(`.collapsible-header[data-question="${qId - 1}"]`).
        parent().
        removeClass('active');
    $(target).children('li').
        children(`.collapsible-header[data-question="${qId - 1}"]`).
        next().
        css('display', "");
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

function removeQAction(elem) {
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

    $(target).children('li').
        children(`.collapsible-header[data-round="${rId - 1}"]`).
        parent().
        removeClass('active');
    $(target).children('li').
        children(`.collapsible-header[data-round="${rId - 1}"]`).
        next().
        css('display', "");
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
    $(target).remove();
    $('#roundCount').val(rCount);
    $(rControlsTarget).append(rControlsHtml);
    listenToRControls();
    $('select').formSelect();
    listenToSelect();
    listenToQControls();
    listenToCheckbox();

    $(prevR).addClass('active');
    $(prevR).
        children(`.collapsible-header[data-round="${rId}"]`).
        next().
        css('display', 'block');
    $(prevR).
        children(`.collapsible-header[data-round="${rId}"]`)[0].
        scrollIntoView();
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
    default:
    }
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

$(function() {
    initChangeConfModal();
    $('.collapsible').collapsible();
    $('select').formSelect();
    listenToChangeConfModalButtons();
    listenToCheckbox();
    listenToSelect();
    setSelectValue($('#quizCategory'), 'general knowledge');
    setSelectValue($('#roundCategory_1'), 'general knowledge');
    reinitSelectOnDisabled($('.round-category'));
    listenToRControls();
    listenToQControls();
    listenToImgInputs();
    listenToQuizTitle();
    listenToSubmitButton();
});