/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global setSelectValue, reinitSelectOnDisabled */

/* Set quiz and round category select box values */
/* Requires initialVals array parameter */
/* Array contains objects with the following properties: /*
/* 'elem': id of select element */
/* 'category': category text */
/* initialVals[0] should relate to the quiz category elem and value, whilst */
/* subsequent array entries will relate to round category elems and values */
// eslint-disable-next-line no-unused-vars
function setInitialSelectVals(initialVals) {

    /* Return the object from the initialVals array that contains */
    /* the quizCategory elem and value */
    const getQuizCategory = (val) => {
        if (val.elem === '#quizCategory') {
            return val;
        }
    };

    /* Get the quiz category value text in lowercase */
    let quizCategory = initialVals.find(getQuizCategory).category.toLowerCase();

    /* If the quiz category is general knowledge, then each round may have */
    /* a unique category, so set the category based on initialVals objects */
    if (quizCategory === 'general knowledge') {
        initialVals.forEach((val) => {
            setSelectValue($(val.elem), val.category.toLowerCase());
        });
        return;
    }

    /* Set the quiz category select box value */
    setSelectValue($('#quizCategory'), quizCategory);

    // let selectContainer = $('#quizCategory').closest('.select-container');
    // let selector = '.select-wrapper ul li.optgroup .subopt span';
    // Object.keys($(selector, selectContainer)).
    //     map((key) => $(selector, selectContainer)[key]).
    //         find((obj) => obj.innerText.
    //             toLowerCase() === quizCategory).
    //                 closest('.subopt').
    //                     click();

    reinitSelectOnDisabled($('.round-category'));
}

/* When document is ready, trigger the .img-url input elem 'input' listener */
/* to load and display images */
$(function () {
    $('.img-url').trigger('input');
});