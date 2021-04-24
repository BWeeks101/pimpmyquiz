/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global setSelectValue, addRound, addQ, removeMulti, addMulti, removeRound,
removeQ, imgPreviewError, imgPreviewLoad, popChangeConfModal, closeToolTip,
inputValidation, quizFormValidation, M, validateCorrectCheckboxes */

// eslint-disable-next-line no-unused-vars
function stopListeningToSelect() {
    let selector = ".select-container .select-wrapper ";
    selector += "ul li.optgroup span div.subopt";
    $(selector).off("click");
}

// eslint-disable-next-line no-unused-vars
function listenToSelect() {
    let selector = ".select-container .select-wrapper ";
    selector += "ul li.optgroup span div.subopt";
    $(selector).on("click", (e) => {
        let self = e.currentTarget;
        let selectContainer = self.closest('.select-container');
        let select = $('.select-wrapper select', selectContainer);
        let value = self.innerText.trim().toLowerCase();
        setSelectValue(select, value);

        if (select.attr('id') === 'quizCategory') {
            setSelectValue($('.round-category'), value);

            //Use Attr for disabled instead of Prop.
            //MaterializeCSS seems to rely on the presence of the Attr.
            if (value === 'general knowledge') {
                $('.round-category').each((i, el) => {
                    $(el).removeAttr('disabled');
                });

            } else {
                $('.round-category').each((i, el) => {
                    $(el).attr('disabled', true);
                });
            }
        }

    });
}

// eslint-disable-next-line no-unused-vars
function stopListeningToRControls() {
    $('.rcontrols-remove').off("click");
    $('.rcontrols-add').off("click");
}

// eslint-disable-next-line no-unused-vars
function listenToRControls() {
    $('.rcontrols-remove').on("click", (e) => {
        e.stopPropagation();
        closeToolTip(e.currentTarget);
        removeRound(e.currentTarget);
    });

    $('.rcontrols-add').on("click", (e) => {
        e.stopPropagation();
        closeToolTip(e.currentTarget);
        addRound(e.currentTarget);
    });
}

// eslint-disable-next-line no-unused-vars
function stopListeningToQControls() {
    $('.qcontrols-remove').off("click");
    $('.qcontrols-add').off("click");
}

// eslint-disable-next-line no-unused-vars
function listenToQControls() {
    $('.qcontrols-remove').on("click", (e) => {
        e.stopPropagation();
        closeToolTip(e.currentTarget);
        removeQ(e.currentTarget);
    });

    $('.qcontrols-add').on("click", (e) => {
        e.stopPropagation();
        closeToolTip(e.currentTarget);
        addQ(e.currentTarget);
    });
}

// eslint-disable-next-line no-unused-vars
function stopListeningToMultiControls() {
    $('a.multi-control-remove').
        off("click");
    $('a.multi-control-add').
        off("click");
}

// eslint-disable-next-line no-unused-vars
function listenToMultiControls() {
    $('a.multi-control-remove').
        on("click", (e) => {
            closeToolTip(e.currentTarget);
            removeMulti(e.currentTarget);
        });
    $('a.multi-control-add').
        on("click", (e) => {
            closeToolTip(e.currentTarget);
            addMulti(e.currentTarget);
        });
}

// eslint-disable-next-line no-unused-vars
function stopListeningToQuizInputs(container) {
    $(container).
        find('input:not(.img-url, [type="checkbox"])').
            off('input');
}

// eslint-disable-next-line no-unused-vars
function listenToQuizInputs(container) {
    // $(container).
    //     find('input:not(.img-url, [type="checkbox"])').
    //         on('input', (e) => inputValidation(e.currentTarget, false));

    $(container).
        find('input:not([type="checkbox"])').
            on('input', (e) => inputValidation(e.currentTarget, false));
}

// eslint-disable-next-line no-unused-vars
function stopListeningToQuizInputHelpers(container) {
    $(container).find('.collapsible').
        each((i, elem) => {
            let instance = M.Collapsible.getInstance(elem);
            if (instance) {
                instance.destroy();
            }
        });
}

// eslint-disable-next-line no-unused-vars
function listenToQuizInputHelpers(container) {
    $(container).find('.collapsible.helper-collapsible').
        collapsible();
}

// eslint-disable-next-line no-unused-vars
// function stopListeningToImgInputs() {
//     // $('input.img-url').off("focusout");
//     // $('input.img-url').off("keyup");
//     $('input.img-url').off("input");
// }

// eslint-disable-next-line no-unused-vars
// function listenToImgInputs() {
//     $('input.img-url').
//         on("input", (e) => inputValidation(e.currentTarget, false));

//     // const updImgPreview = (elem) => {
//     //     checkImgUrl(elem);
//     //     imgPreview($(elem).val(), $(elem).
//     //         closest('.input-field').
//     //         next());
//     // };

//     // $('input.img-url').
//     //     on("focusout", (e) => {
//     //         updImgPreview(e.currentTarget);
//     //     });

//     // $('input.img-url').
//     //     on("keyup", (e) => {
//     //         if (e.key === 'Enter' ||
//     //                 e.key === 'Delete' ||
//     //                 e.key === 'Backspace') {
//     //             // updImgPreview(e.currentTarget);
//     //             inputValidation(e.currentTarget, true);
//     //         }
//     //     });
// }

function stopListeningToImgPreview(elem) {
    $(elem).off("error");
    $(elem).off("load");
}

// eslint-disable-next-line no-unused-vars
function listenToImgPreview(elem) {
    stopListeningToImgPreview(elem);
    $(elem).on("error", () => imgPreviewError(elem,
        `Unable to preview Image.<br>Please check the URL.`));
    $(elem).on("load", () => imgPreviewLoad(elem, $(elem).
            closest('.collapsible-body').
            width())
    );
}

// eslint-disable-next-line no-unused-vars
function listenToSubmitButton() {
    $('#submitButton').on("click", (e) => {
        e.preventDefault();
        quizFormValidation();
    });
}

// eslint-disable-next-line no-unused-vars
function listenToCancelUrl() {
    $('#cancelUrl').on('click', (e) => {
        e.preventDefault();
        if ($('#editQuiz').length) {
            popChangeConfModal('ce', e.currentTarget);
            return;
        }
        popChangeConfModal('cn', e.currentTarget);
    });
}

// eslint-disable-next-line no-unused-vars
function stopListeningToCorrectCheckboxes(container) {
    $(container).
        find('.correct[type="checkbox"]').
            off('change');
}

// eslint-disable-next-line no-unused-vars
function listenToCorrectCheckboxes(container) {
    $(container).
        find('.correct[type="checkbox"]').
            on('change', (e) => validateCorrectCheckboxes(e.currentTarget));
}

// eslint-disable-next-line no-unused-vars
function stopListeningToCheckbox() {
    $('input[type="checkbox"].quizMulti').
        off("change");
}

// eslint-disable-next-line no-unused-vars
function listenToCheckbox() {
    $('input[type="checkbox"].quizMulti').on('change', (e) => {
        let self = e.currentTarget;
        if (!$(self).prop('checked')) {
            popChangeConfModal('mu', self);
            return;
        }
        popChangeConfModal('mc', self);
    });
}