/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
/* global setSelectValue, addRound, addQ, removeMulti, addMulti, removeRound,
removeQ, imgPreview, imgPreviewError, imgPreviewLoad, inputHelperLabel */

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
        let value = self.innerText.trim();
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
    $('.rcontrols-remove').on("click", (e) => removeRound(e.currentTarget));
    $('.rcontrols-add').on("click", (e) => {
        e.stopPropagation();
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
    $('.qcontrols-remove').on("click", (e) => removeQ(e.currentTarget));
    $('.qcontrols-add').on("click", (e) => {
        e.stopPropagation();
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
        on("click", (e) => removeMulti(e.currentTarget));
    $('a.multi-control-add').
        on("click", (e) => addMulti(e.currentTarget));
}

// eslint-disable-next-line no-unused-vars
function stopListeningToImgInputs() {
    $('input.img-url').off("focusout");
    $('input.img-url').off("keyup");
}

// eslint-disable-next-line no-unused-vars
function listenToImgInputs() {
    stopListeningToImgInputs();
    const checkImgUrl = (elem) => {
        if ($(elem).val().length === 0) {
            $(elem).removeClass("invalid");
        }
        inputHelperLabel($(elem).attr('id'));
    };

    $('input.img-url').
        on("focusout", (e) => {
            checkImgUrl(e.currentTarget);
            imgPreview(e.currentTarget);
        });

    $('input.img-url').
        on("keyup", (e) => {
            if (e.key === 'Enter' ||
                    e.key === 'Delete' ||
                    e.key === 'Backspace') {
                checkImgUrl(e.currentTarget);
                imgPreview(e.currentTarget);
            }
        });
}

function stopListeningToImgPreview() {
    $('div.image-preview img').off("error");
    $('div.image-preview img').off("load");
}

// eslint-disable-next-line no-unused-vars
function listenToImgPreview() {
    stopListeningToImgPreview();
    $('div.image-preview img').
        on("error", (e) => imgPreviewError(e.currentTarget));
    $('div.image-preview img').
        on("load", (e) => imgPreviewLoad(e.currentTarget));
}