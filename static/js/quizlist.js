/* global addRecordPositions, inputHelperLabel, xHttpRequest, setSelectValue,
addObserver, getObserver */

function deleteQuiz(quizId) {
    let confText = 'If you delete this quiz, all associated rounds and ' +
        'questions will also be deleted.  Do you wish to continue?';
    // eslint-disable-next-line no-alert
    let response = confirm(confText);
    if (response === true) {
        open(`/delete_quiz?&id=${quizId}`, '_self');
    }
}

function stopListeningToDelLinks() {
    $('.del-quiz').off('click');
}

function listenToDelLinks() {
    stopListeningToDelLinks();
    $('.del-quiz').on('click', (e) => {
        e.stopPropagation();
        deleteQuiz($(e.currentTarget).attr('data-quizId'));
    });
}

function getQuizSearchResults(isGlobal) {
    let value = $('#quizSearch').val();
    let category = $('#quizCategory').val();
    if (value === "" || value === undefined || value.length < 2) {
        return;
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

function observeQuizResults() {
    addObserver($('#quizSearchResults')[0], listenToDelLinks);
    let observer = getObserver($('#quizSearchResults')[0]);
    observer.observe($('#quizSearchResults')[0], {childList: true});
}

// eslint-disable-next-line no-unused-vars
let observerList = [];

$(function() {
    getInitialQuizList();
    quizSearchCreateListeners();
    listenToSelect();
    observeQuizResults();
});