/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
// eslint-disable-next-line no-unused-vars
/* global titleValidationInProgress:writable */
/* global M, quizTitleValidate, listenToQuizTitle */

function copyQuiz() {
    let url = '/copy_quiz?id=' +
    $('#modalSubmitButton').attr('data-quizId') +
    '&title=' + $('#quizTitle').val();
    window.location.href = url;
}

// eslint-disable-next-line no-unused-vars
function copyQuizListener() {
    const invalid = () => {
        let instance = M.Modal.getInstance(
            document.querySelector('#dupTitleModal'));
        if (!instance.isOpen) {
            M.updateTextFields();
            instance.open();
        }
    };

    const valid = () => {
        copyQuiz();
    };

    quizTitleValidate(invalid, valid);
}

function listenToModalSaveButton() {
    $('#modalSubmitButton').on("click", () => {
        titleValidationInProgress = false;

        const valid = () => {
            copyQuiz();
        };

        quizTitleValidate('', valid);
    });
}

// eslint-disable-next-line no-unused-vars
function initDupTitleModal(callBackFunc) {
    M.Modal.init(document.querySelector('#dupTitleModal'), {
        onCloseEnd: callBackFunc
    });
}

$(function() {
    listenToQuizTitle();
    listenToModalSaveButton();
});