/* global addRecordPositions, inputHelperLabel, xHttpRequest, setSelectValue */

function getQuizSearchResults() {
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

// eslint-disable-next-line no-unused-vars
function deleteQuiz(quizId) {
    let confText = 'If you delete this quiz, all associated rounds and ' +
        'questions will also be deleted.  Do you wish to continue?';
    // eslint-disable-next-line no-alert
    let response = confirm(confText);
    if (response === true) {
        open(`/delete_quiz?&id=${quizId}`, '_self');
    }
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
    xHttpRequest(request, $('#quizSearchResults')[0]);
}

$(function() {
    getInitialQuizList();
    quizSearchCreateListeners();
    listenToSelect();
});