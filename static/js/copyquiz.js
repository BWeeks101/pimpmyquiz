/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global M, quizTitleValidate */
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

function listenToQuizTitle() {
    $('#quizTitle').on("focusout keyup", (e) => {
        if ($('#quizTitle').val().length > 0) {
            if (e.type === 'keyup' && e.key !== 'Enter') {
                return;
            }
            quizTitleValidate();
        }
    });
}

function listenToModalSaveButton() {
    $('#modalSubmitButton').on("click", () => {
        const invalid = () => {
            $('#modalSubmitButton').attr('disabled', false);
        };

        const valid = () => {
            copyQuiz();
        };

        quizTitleValidate(invalid, valid);
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