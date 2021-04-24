/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global setSelectValue, reinitSelectOnDisabled */

function listenToCollapsibleHeaders() {
    $('.collapsible-header:not[.helper-collapsible]').on('click', (e) => {
        let self = $(e.currentTarget);
        let imgUrl;
        let img;
        if (self.parent().hasClass('active') === false) {
            imgUrl = $(self).next().
                find('.img-url');
            img = $(imgUrl).parent().
                next().
                children('img');
            if ((!$(img)[0]) ||
                ($(img).height() === 0 && $(img).width() === 0)) {
                $(imgUrl).trigger('focusout');
            }
        }
    });
}

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
    listenToCollapsibleHeaders();
    $('li.active li.active .img-url').trigger('focusout');
});