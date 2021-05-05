/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global copyQuizListener, addRecordPositions, xHttpRequest, listenToSelect,
initDupTitleModal, popChangeConfModal, initChangeConfModal,
listenToChangeConfModalButtons, observeResults, closeToolTip,
resetModalQuizTitleInput */

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

        /* Set the #modalQuizTitle value to the html of the .quiz-title */
        /* element appropriate to the clicked element */
        $('#modalQuizTitle').val($(e.currentTarget).closest('li').
            find('.quiz-title').
                html());

        /* set the #modalCopyQuizButton data-quizId attribute to the */
        /* data-quizId of the clicked element */
        $('#modalCopyQuizButton').
            attr('data-quizId', $(e.currentTarget).attr('data-quizId'));

        copyQuizListener(); // Call copyQuizListener()
    });
}

/* Add click listeners to delete quiz links */
function listenToDelLinks() {
    $('.del-quiz').on('click', (e) => {
        e.stopPropagation(); // Prevent the default link click action
        // Call the change confirmation modal with a type of 'dq' (Delete Quiz)
        popChangeConfModal('dq', e.currentTarget);
    });
}

/* Format search request and execute xHttp call to search */
/* Optional isGlobal parameter defines whether the search is a global quiz */
/* search, or a current user quiz search (default) */
function getQuizSearchResults(isGlobal = false) {
    // Get the search string
    let value = $('#quizSearch').val();

    // Get the quiz category
    let category = $('#quizCategory').val();

    // If the search text is missing, replace it with '*' wildcard
    if (value === "" || value === undefined || value.length < 1) {
        value = '*';
    }

    // Create an xHttp request object
    let request = {
        'type':
            'myQuizSearch', // current user quiz search
        'params': {
            'searchStr': value, // search string
            'page': 1, // Return the 1st page of results
            category // quiz category
        }
    };

    // If this is a global search, alter the request.type property
    if (isGlobal === true) {
        request.type = 'globalQuizSearch';
    }

    // Call addRecordPositions() to record the search string and results page
    addRecordPositions({
        'quizSearch': request.params.searchStr,
        'currentPage': 1
    });

    // Call xHttpRequest()
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

/* Adds keyup listener to quizSearch input, and click listener to */
/* searchButton */
function quizSearchCreateListeners() {

    /* Execute Search on Enter keypress */
    $("#quizSearch").on("keyup", (e) => {
        let isGlobal;
        if (e.key === "Enter") {
            // If the search button has the data-type="global"...
            isGlobal = $(e.currentTarget).parent().
                parent().
                    nextAll('.search-action-container').
                        children('button[data-type="global"]').
                            attr('data-type');
            if (isGlobal) {
                getQuizSearchResults(true); // ...perform a global search
            } else {
                getQuizSearchResults(); // Otherwise perform a regular search
            }
        }
    });

    /* Execute Search on button click */
    $("#searchButton").on("click", (e) => {
        // If the search button has the data-type="global"...
        let isGlobal = $(e.currentTarget).attr('data-type');
        if (isGlobal) {
            getQuizSearchResults(true); // ...perform a global search
        } else {
            getQuizSearchResults(); // Otherwise perform a regular search
        }
    });
}

/* Returns the first page of quiz results */
function getInitialQuizList() {
    // Create an xHttp request object
    let request = {
        'type':
            'myQuizSearch', // current user quiz search
        'params': {
            'searchStr': '*', // search string
            'page': 1, // Return the 1st page of results
            'category': 'All' // quiz category
        }
    };

    // If the search button has the data-type="global" this is a global search
    let isGlobal = $('.search-action-container button[data-type="global"]').
        attr('data-type');

    // If this is a global search, alter the request.type property
    if (isGlobal) {
        request.type = 'globalQuizSearch';
    }

    // Call xHttpRequest()
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

/* Initialise listeners and MaterializeCSS Tooltips for elems returned within */
/* search results */
function initEmbeddedSearchResultControls() {
    // Add click listener to a elems within results
    listenToResultsATags();

    // Add click listener to .copy-quiz elems within results
    listenToCopyQuizLinks();

    // Add click listener to .del-quiz elems within results
    listenToDelLinks();

    // Initialise MaterializeCSS Tooltips within results
    $('.results-data .tooltipped').tooltip();
}

/* When document is ready, get initial quiz list, initialise listeners, */
/* modals, search result observer and returned controls */
$(function() {
    // Initialise MaterializeCSS Select boxes
    $('select').formSelect();

    // Return initial search results
    getInitialQuizList();

    // Initialise listeners for search input and button
    quizSearchCreateListeners();

    // Initialise listeners for .subopt elems within select elements
    listenToSelect();

    // Initialise the duplicate title modal
    initDupTitleModal(resetModalQuizTitleInput);

    // Initialise the change confirmation modal and button listeners
    initChangeConfModal();
    listenToChangeConfModalButtons();

    // Add observer to #quizSearchResults container
    observeResults($('#quizSearchResults')[0],
        initEmbeddedSearchResultControls);
});