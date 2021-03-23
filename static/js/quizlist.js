/* global addRecordPositions, inputHelperLabel, xHttpRequest, setSelectValue */

function getQuizSearchResults() {
    let value = $('#quizSearch').val();
    let category = $('#quizCategory').val();
    if (value === "" || value === undefined || value.length < 2) {
        return;
    }
    let request = {
        'type':
            'quizSearch',
        'params': {
            'searchStr': value,
            'page': 1,
            category
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

// eslint-disable-next-line no-unused-vars
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
            'quizSearch',
        'params': {
            'searchStr': '*',
            'page': 1,
            'category': 'All'
        }
    };
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

$(function() {
    getInitialQuizList();
    quizSearchCreateListeners();
    listenToSelect();
});