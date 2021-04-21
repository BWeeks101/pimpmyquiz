/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global imgPreviewError, imgPreviewLoad, copyQuizListener, inputValidation,
initDupTitleModal */

function stopListeningToQuizImg(elem) {
    $(elem).off("error");
    $(elem).off("load");
}

// eslint-disable-next-line no-unused-vars
function listenToQuizImg(elem) {
    $(elem).on("error", () => {
        stopListeningToQuizImg(elem);
        imgPreviewError(elem, "Image Not Found.");
    });
    $(elem).on("load", () => {
        stopListeningToQuizImg(elem);
        imgPreviewLoad(elem);
    });
}

// eslint-disable-next-line no-unused-vars
function loadImg(roundList) {
    const isValidData = (url) => {
        switch (url) {
        case null:
        case undefined:
            url = '';
            break;
        default:
        }

        return url;
    };

    roundList.forEach(function (round) {
        let roundNum = round.round_num;
        round.questions.forEach(function (question) {
            let questionNum = question.question_num;
            // eslint-disable-next-line camelcase
            question.question_img_url = isValidData(question.question_img_url);
            $(`#img_q_${roundNum}_${questionNum}`).
                attr('src', question.question_img_url);

            if (question.multiple_choice === false) {
                // eslint-disable-next-line camelcase
                question.answer_img_url = isValidData(question.answer_img_url);
                $(`#img_a_${roundNum}_${questionNum}`).
                    attr('src', question.answer_img_url);

            } else {
                question.multiple_choice_options.forEach(function (option) {
                    let optionNum = option.option_num;
                    // eslint-disable-next-line camelcase
                    option.answer_img_url = isValidData(option.answer_img_url);
                    $(`#img_o_${roundNum}_${questionNum}_${optionNum}`).
                        attr('src', option.answer_img_url);
                });
            }
        });
    });
}

function listenToCopyQuiz() {
    $('.copy-quiz').on("click", () => {
        copyQuizListener();
    });
}

function resetModalQuizTitleInput() {
    $('#modalQuizTitle').attr('data-prev', '');
    $('#modalQuizTitle:hidden').
        val($('#quizOriginalTitle').html());
    inputValidation($('#modalQuizTitle'));
}

$(function() {
    if ($('#viewQuiz').length) {
        resetModalQuizTitleInput();
        initDupTitleModal(resetModalQuizTitleInput);
        listenToCopyQuiz();
    }
    $('.quiz-image').each((i, elem) => listenToQuizImg(elem));
});