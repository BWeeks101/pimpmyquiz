/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global imgPreviewError, imgPreviewLoad, copyQuizListener,
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
function loadImg(pyList) {
    pyList.forEach(function (round) {
        let roundNum = round.round_num;
        round.questions.forEach(function (question) {
            let questionNum = question.question_num;
            if (question.question_img_url.length > 0) {
                $(`#img_q_${roundNum}_${questionNum}`).
                    attr('src', question.question_img_url);
            }
            if (question.multiple_choice === false) {
                if (question.answer_img_url &&
                        question.answer_img_url.length > 0) {
                    $(`#img_a_${roundNum}_${questionNum}`).
                        attr('src', question.answer_img_url);
                }
            } else {
                question.multiple_choice_options.forEach(function (option) {
                    let optionNum = option.option_num;
                    if (option.answer_img_url.length > 0) {
                        $(`#img_o_${roundNum}_${questionNum}_${optionNum}`).
                            attr('src', option.answer_img_url);
                    }
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

function resetQuizTitleInput() {
    $('#quizTitle').attr('data-prev', '');
    $('#quizTitle:hidden').
    val($('#quizOriginalTitle').html());
}

$(function() {
    if ($('#dupTitleModal').length) {
        initDupTitleModal(resetQuizTitleInput);
        listenToCopyQuiz();
    }
    $('.quiz-image').each((i, elem) => listenToQuizImg(elem));
});