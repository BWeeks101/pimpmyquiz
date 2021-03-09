/* global getCategory */

function getCategoryIconClass(category) {
    return getCategory(category).category_icon;
}

function setSelectIcon(elem, value) {
    let iconClass = getCategoryIconClass(value);
    elem.addClass(iconClass);
}

function clearSelectIcon(elem, value) {
    let iconClass = getCategoryIconClass(value);
    elem.removeClass(iconClass);
}

function setSelectValue(elem, value) {
    let selectContainer = elem.closest('.select-container');
    let selectIcon = $('i.prefix', selectContainer);
    clearSelectIcon(selectIcon, elem.val());
    let selector = `.select-wrapper `;
    selector += 'ul li.optgroup-option';
    Object.keys($(selector, selectContainer)).
        map((key) => $(selector, selectContainer)[key]).
            find((obj) => obj.innerText === value).
                click();
    setSelectIcon(selectIcon, value);
}

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
            setSelectValue($('#roundCategory'), value);

            //Use Attr for disabled instead of Prop.
            //MaterializeCSS seems to rely on the presence of the Attr.
            if (value === 'general knowledge') {
                $('#roundCategory').removeAttr('disabled');
            } else if (!$('#roundCategory').attr('disabled')) {
                $('#roundCategory').attr('disabled', true);
            }
        }

    });
}

function reinitSelectOnDisabled(elem) {
    const observer = new MutationObserver(() => {
        let selector = ".select-container .select-wrapper ";
        selector += "ul li.optgroup span div.subopt";
        $(selector).off("click");
        elem.formSelect();
        listenToSelect();
    });

    observer.observe(elem[0], {attributeFilter: ['disabled']});
}

$(function() {
    listenToSelect();
    setSelectValue($('#quizCategory'), 'general knowledge');
    setSelectValue($('#roundCategory'), 'general knowledge');
    reinitSelectOnDisabled($('#roundCategory'));
});