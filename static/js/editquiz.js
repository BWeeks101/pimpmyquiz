/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global setSelectValue, reinitSelectOnDisabled */

// eslint-disable-next-line no-unused-vars
function setInitialSelectVals(initialVals) {
    const getQuizCategory = (val) => {
        if (val.elem === '#quizCategory') {
            return val;
        }
    };

    let quizCategory = initialVals.find(getQuizCategory).category.toLowerCase();

    if (quizCategory === 'general knowledge') {
        initialVals.forEach((val) => {
            setSelectValue($(val.elem), val.category.toLowerCase());
        });
        return;
    }

    setSelectValue($('#quizCategory'), quizCategory);

    let selectContainer = $('#quizCategory').closest('.select-container');
    let selector = `.select-wrapper `;
    selector += 'ul li.optgroup .subopt span';
    Object.keys($(selector, selectContainer)).
        map((key) => $(selector, selectContainer)[key]).
            find((obj) => obj.innerText.
                toLowerCase() === quizCategory).
                    closest('.subopt').
                        click();

    reinitSelectOnDisabled($('.round-category'));
}

$(function () {
    $('.img-url').trigger('input');
});