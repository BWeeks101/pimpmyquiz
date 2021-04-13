/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global copyQuizListener, initDupTitleModal */

// eslint-disable-next-line no-unused-vars
function imgLoad(elem) {
    let self = $(elem);
    let img = {
        'height': self.height(),
        'width': self.width()
    };
    let max = self.css('max-width');
    let val;
    if (img.width === img.height) {
        val = max;
        self.height(val);
    } else if (img.width > img.height) {
        val = (max / 100) * ((img.height / img.width) * 100);
        self.height(val);

    } else {
        val = (max / 100) * ((img.width / img.height) * 100);
        self.width(val);
    }
    $(self).removeClass('hidden');
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
    initDupTitleModal(resetQuizTitleInput);
    listenToCopyQuiz();
    $('.quiz-image').each((i, elem) => imgLoad(elem));
});