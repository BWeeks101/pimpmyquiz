/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global copyQuizListener, addRecordPositions, xHttpRequest, setSelectValue,
initDupTitleModal, popChangeConfModal, initChangeConfModal,
listenToChangeConfModalButtons, observeResults, closeToolTip, getInputHelper */

/* Send a server call to delete a quiz */
/* Requires a quizId passed as a string or integer */
// eslint-disable-next-line no-unused-vars
function deleteQuiz(quizId) {
    open(`/delete_quiz?&id=${quizId}`, '_self');
}

/* Add click listeners to a elems within .results-data containers */
function listenToResultsATags() {

    /* Close the MaterializeCSS tooltip when the link is clicked */
    /* Prevents inconsistent tooltip display behaviour when browser */
    /* navigation buttons are used on mobile devices after a link is clicked */
    $('.results-data a').on('click', (e) => {
        closeToolTip(e.currentTarget);
    });
}

/* Add click listeners to copy quiz links */
function listenToCopyQuizLinks() {
    $('.copy-quiz').on("click", (e) => {
        let self = e.currentTarget;
        $('#modalQuizTitle').val($(self).closest('li').
            find('.quiz-title').
            html());

        $('#modalCopyQuizButton').
            attr('data-quizId', $(self).attr('data-quizId'));

        copyQuizListener();
    });
}

/* Add click listeners to delete quiz links */
function listenToDelLinks() {
    $('.del-quiz').on('click', (e) => {
        e.stopPropagation();
        popChangeConfModal('d', e.currentTarget);
    });
}

/* Format search request and execute xHttp call to search */
/* Optional isGlobal parameter defines whether the search is a global quiz */
/* search, or a current user quiz search (default) */
function getQuizSearchResults(isGlobal = false) {
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
    if (isGlobal === true) {
        request.type = 'globalQuizSearch';
    }
    addRecordPositions({
        'quizSearch': request.params.searchStr,
        'currentPage': 1
    });
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

/* Adds keyup listener to quizSearch input, and click listener to */
/* searchButton */
function quizSearchCreateListeners() {

    /* Execute Search on Enter keypress */
    $("#quizSearch").on("keyup", (e) => {
        let isGlobal;
        if (e.key === "Enter") {
            isGlobal = $(e.currentTarget).parent().
                parent().
                    nextAll('.search-action-container').
                        children('button[data-type="global"]').
                            attr('data-type');
            if (isGlobal) {
                getQuizSearchResults(true);
            } else {
                getQuizSearchResults();
            }
        }
    });

    /* Execute Search on button click */
    $("#searchButton").on("click", (e) => {
        let isGlobal = $(e.currentTarget).attr('data-type');
        if (isGlobal) {
            getQuizSearchResults(true);
        } else {
            getQuizSearchResults();
        }
    });
}

/* Adds click listener to .subopt elems within select box */
/* Allows custom styled select options to function */
function listenToSelect() {
    let selector = ".select-container .select-wrapper ";
    selector += "ul li.optgroup span div.subopt";
    $(selector).on("click", (e) => {
        let self = e.currentTarget;
        let selectContainer = self.closest('.select-container');
        let select = $('.select-wrapper select', selectContainer);
        let value = self.innerText.trim().toLowerCase();
        setSelectValue(select, value);
    });
}

/* Returns the first page of quiz results */
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

/* Initialise listeners, tooltips for elems returned within search results  */
function initEmbeddedSearchResultControls() {
    listenToResultsATags();
    listenToCopyQuizLinks();
    listenToDelLinks();
    $('.results-data .tooltipped').tooltip();
}

/* Reset dupTitleModal elem values/data */
function resetModalQuizTitleInput() {
    $('#modalQuizTitle').attr('data-prev', '');
    $('#modalQuizTitle:hidden').val('');
    getInputHelper($('#modalQuizTitle')).close();
    $('#modalCopyQuizButton').attr('data-quizId', '');
    listenToCopyQuizLinks();
}

/* When document is ready, get initial quiz list, initialise listeners, */
/* modals, search result observer and returned controls */
$(function() {
    $('select').formSelect();
    getInitialQuizList();
    quizSearchCreateListeners();
    listenToSelect();
    initDupTitleModal(resetModalQuizTitleInput);
    initChangeConfModal();
    listenToChangeConfModalButtons();
    observeResults($('#quizSearchResults')[0],
        initEmbeddedSearchResultControls);
});