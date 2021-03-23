/* global addRecordPositions, inputHelperLabel, xHttpRequest */

function getQuizSearchResults() {
    let value = $('#quizSearch').val();
    if (value === "" || value === undefined || value.length < 2) {
        return;
    }
    let request = {
        'type':
            'quizSearch',
        'params': {
            'searchStr': value,
            'page': 1
        }
    };
    addRecordPositions({
        'quizSearch': request.params.searchStr,
        'currentPage': 1
    });
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

function quizSearchCreateListeners() {
    $("#quizSearch").on("focusout", () => inputHelperLabel("quizSearch"));

    $("#quizSearch").on("keyup", (e) => {
        if (e.key === "Enter") {
            inputHelperLabel("quizSearch");
            getQuizSearchResults();
        }
    });

    $("#searchButton").
        on("click", () => getQuizSearchResults());
}

$('#quizCollection .results-control .results-control-first')[0].click();
quizSearchCreateListeners();