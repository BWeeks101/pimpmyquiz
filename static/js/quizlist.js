/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global copyQuizListener, addRecordPositions, inputHelperLabel, xHttpRequest,
setSelectValue, addObserver, getObserver, initDupTitleModal,
popChangeConfModal, initChangeConfModal, listenToChangeConfModalButtons */

// eslint-disable-next-line no-unused-vars
function deleteQuiz(quizId) {
    open(`/delete_quiz?&id=${quizId}`, '_self');
}

function stopListeningToDelLinks() {
    $('.del-quiz').off('click');
}

function stopListeningToCopyQuizLinks() {
    $('.copy-quiz').off('click');
}

function listenToCopyQuizLinks() {
    stopListeningToCopyQuizLinks();
    $('.copy-quiz').on("click", (e) => {
        let self = e.currentTarget;
        $('#quizTitle').val($(self).closest('li').
            find('.quiz-title').
            html());

        $('#modalSubmitButton').
            attr('data-quizId', $(self).attr('data-quizId'));

        copyQuizListener();
    });
}

function listenToDelLinks() {
    stopListeningToDelLinks();
    $('.del-quiz').on('click', (e) => {
        e.stopPropagation();
        popChangeConfModal('d', e.currentTarget);
    });
}

function getQuizSearchResults(isGlobal) {
    let value = $('#quizSearch').val();
    let category = $('#quizCategory').val();
    if (value === "" || value === undefined || value.length < 1) {
        value = '*';
    }
    let request = {
        'type':
            'myQuizSearch',
        'params': {
            'searchStr': value,
            'page': 1,
            category
        }
    };
    if (isGlobal) {
        request.type = 'globalQuizSearch';
    }
    addRecordPositions({
        'quizSearch': request.params.searchStr,
        'currentPage': 1
    });
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

function quizSearchCreateListeners() {
    $("#quizSearch").on("focusout", () => inputHelperLabel("quizSearch"));

    $("#quizSearch").on("keyup", (e) => {
        let isGlobal;
        if (e.key === "Enter") {
            inputHelperLabel("quizSearch");
            isGlobal = $(e.currentTarget).parent().
                parent().
                nextAll('.search-action-container').
                children('button[data-type="global"]').
                attr('data-type');
            stopListeningToDelLinks();
            if (isGlobal) {
                getQuizSearchResults(true);
            } else {
                getQuizSearchResults();
            }
        }
    });

    $("#searchButton").on("click", (e) => {
        let isGlobal = $(e.currentTarget).attr('data-type');
        stopListeningToDelLinks();
        if (isGlobal) {
            getQuizSearchResults(true);
        } else {
            getQuizSearchResults();
        }
    });
}

function listenToSelect() {
    let selector = ".select-container .select-wrapper ";
    selector += "ul li.optgroup span div.subopt";
    $(selector).on("click", (e) => {
        let self = e.currentTarget;
        let selectContainer = self.closest('.select-container');
        let select = $('.select-wrapper select', selectContainer);
        let value = self.innerText.trim();
        setSelectValue(select, value);
    });
}

function getInitialQuizList() {
    let request = {
        'type':
            'myQuizSearch',
        'params': {
            'searchStr': '*',
            'page': 1,
            'category': 'All'
        }
    };
    let isGlobal = $('.search-action-container button[data-type="global"]').
        attr('data-type');
    if (isGlobal) {
        request.type = 'globalQuizSearch';
    }
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

function listenToLinks() {
    listenToCopyQuizLinks();
    listenToDelLinks();
}

function observeQuizResults() {
    addObserver($('#quizSearchResults')[0], listenToLinks);
    let observer = getObserver($('#quizSearchResults')[0]);
    observer.observe($('#quizSearchResults')[0], {childList: true});
}

function resetQuizTitleInput() {
    $('#quizTitle').attr('data-prev', '');
    $('#quizTitle:hidden').val('');
    $('#modalSubmitButton').attr('data-quizId', '');
    listenToCopyQuizLinks();
}

// eslint-disable-next-line no-unused-vars
let observerList = [];

$(function() {
    $('select').formSelect();
    getInitialQuizList();
    quizSearchCreateListeners();
    listenToSelect();
    initDupTitleModal(resetQuizTitleInput);
    initChangeConfModal();
    listenToChangeConfModalButtons();
    observeQuizResults();
});