/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global M, quizTitleValidate, listenToQuizTitle */

/* Formulate the /cop_quiz url, and pass it to the server */
function copyQuiz() {
    let url = '/copy_quiz?id=' +
        $('#modalCopyQuizButton').attr('data-quizId') +
            '&title=' + $('#modalQuizTitle').val();
    window.location.href = url;
}

/* Validate whether the quiz title is unique before copying */
// eslint-disable-next-line no-unused-vars
function copyQuizListener() {

    /* Callback function */
    /* If quiz title is not unique for the current user, execute this func */
    const invalid = () => {
        let instance = M.Modal.getInstance(
            document.querySelector('#dupTitleModal'));
        if (!instance.isOpen) {
            M.updateTextFields();
            instance.open();
        }
    };

    /* Callback function */
    /* If quiz title is unique for the current users, execute this func */
    const valid = () => {
        copyQuiz();
    };

    /* Validate the quiz title, and execute the relevant callback func */
    quizTitleValidate(invalid, valid);
}

/* Add click listener to modal submit button */
function listenToModalCopyQuizButton() {
    $('#modalCopyQuizButton').on("click", () => {

        /* Callback function */
        /* If quiz title is unique for the current users, execute this func */
        const valid = () => {
            copyQuiz();
        };

        /* Validate the quiz title, calling valid if true, and ignoring the */
        /* default 1s delay before server submission */
        /* If invalid, do nothing.  The modal is already open. */
        quizTitleValidate('', valid, true);
    });
}

/* Initialise the duplicate title modal */
/* Expects a callback function as a parameter */
/* The callback function will be called when the modal is closed */
// eslint-disable-next-line no-unused-vars
function initDupTitleModal(callBackFunc) {
    M.Modal.init(document.querySelector('#dupTitleModal'), {
        onCloseEnd: callBackFunc
    });
}

/* When the document is ready, initialise listeners */
$(function() {
    listenToQuizTitle();
    listenToModalCopyQuizButton();
});