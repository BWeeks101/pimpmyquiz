/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global imgPreviewError, imgPreviewLoad, copyQuizListener,
resetModalQuizTitleInput, initDupTitleModal */

/* Remove error/load listeners from specified element */
/* Requires: */
/*  elem: img.quiz-image element */
function stopListeningToQuizImg(elem) {
    $(elem).off("error");
    $(elem).off("load");
}

/* Add error/load listeners to specified element */
/* Requires: */
/*  elem: img.quiz-image element */
// eslint-disable-next-line no-unused-vars
function listenToQuizImg(elem) {
    // Define the error listener
    $(elem).on("error", () => {
        // Remove error/load listeners from the elem
        stopListeningToQuizImg(elem);

        // Call imgPreviewError()
        imgPreviewError(elem, "Image Not Found.");
    });

    // Define the load listener
    $(elem).on("load", () => {
        // Remove error/load listeners from the elem
        stopListeningToQuizImg(elem);

        // Call imgPreviewLoad()
        imgPreviewLoad(elem);
    });
}

/* Load and display images */
/* Requires: */
/*  roundList: Array of round, question and multiple choice values */
// eslint-disable-next-line no-unused-vars
function loadImg(roundList) {

    /* Test a url for null/invalid, and redefine it as an empty string */
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

    /* For each round object within the roundList array */
    roundList.forEach(function (round) {
        let roundNum = round.round_num; // Get the round Id

        /* For each question object within the round object */
        round.questions.forEach(function (question) {
            let questionNum = question.question_num; // Get the question Id
            // Get the question image url
            // eslint-disable-next-line camelcase
            question.question_img_url = isValidData(question.question_img_url);
            // Apply the url to the question .img-url elem src property
            $(`#img_q_${roundNum}_${questionNum}`).
                attr('src', question.question_img_url);

            if (question.multiple_choice === false) {
                // If not multiple choice, get the answer image url
                // eslint-disable-next-line camelcase
                question.answer_img_url = isValidData(question.answer_img_url);
                // Apply the url to the answer .img-url elem src property
                $(`#img_a_${roundNum}_${questionNum}`).
                    attr('src', question.answer_img_url);

            } else { // If multiple choice...
                // For each option object within the question object
                question.multiple_choice_options.forEach(function (option) {
                    let optionNum = option.option_num; // Get the option Id
                    // Get the option image url
                    // eslint-disable-next-line camelcase
                    option.answer_img_url = isValidData(option.answer_img_url);
                    // Apply the url to the option .img-url elem src property
                    $(`#img_o_${roundNum}_${questionNum}_${optionNum}`).
                        attr('src', option.answer_img_url);
                });
            }
        });
    });
}

/* Add click listener to .copy-quiz element */
function listenToCopyQuiz() {
    // On click, call copyQuizListener()
    $('.copy-quiz').on("click", () => {
        copyQuizListener();
    });
}

/* Document Ready Function */
$(function() {
    // If the #viewQuiz element is present...
    if ($('#viewQuiz').length) {
        // Reset the #modalQuizTitle input
        resetModalQuizTitleInput();
        // Initialise the duplicate title modal
        initDupTitleModal(resetModalQuizTitleInput);
        // Initialise the click listener on the .copy-quiz element
        listenToCopyQuiz();
    }

    // For each .quiz-image element, call listenToQuizImg()
    // (i declaration required by jQuery .each)
    $('.quiz-image').each((i, elem) => listenToQuizImg(elem));
});