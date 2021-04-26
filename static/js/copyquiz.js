/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global M, quizTitleValidate, listenToQuizTitle */

function copyQuiz() {
    let url = '/copy_quiz?id=' +
        $('#modalSubmitButton').attr('data-quizId') +
            '&title=' + $('#modalQuizTitle').val();
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
        const valid = () => {
            copyQuiz();
        };

        quizTitleValidate('', valid, true);
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