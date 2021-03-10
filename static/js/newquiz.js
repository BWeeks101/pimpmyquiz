/*eslint func-style: ["error", "declaration", { "allowArrowFunctions": true }]*/
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

// eslint-disable-next-line no-unused-vars
function addMulti(elem) {
    let answersContainer = $(elem).closest('.answers-container');
    let prefix = $(elem).closest('.prefix');
    let qId = parseInt(prefix.attr('data-question'));
    let mlt = parseInt(prefix.attr('data-multi')) + 1;

    prefix.html("");
    let controlHtml = `
        <a href="#!" onclick="removeMulti(this)">-</a>` +
        `<a href="#!" onclick="addMulti(this)">+</a>`;
    let answerHtml = `
        <div class="input-field col s10">
            <span class="prefix light-blue-text text-darken-4 ` +
                `center-align" data-question="${qId}"` +
                `data-multi="${mlt}">
                ${controlHtml}` +
            `</span>
            <input id="answer_${qId}-${mlt}" ` +
                `name="answer_${qId}-${mlt}" ` +
                `type="text" minlength="1" maxlength="100" ` +
                `class="validate" value="" required>
            <label for="answer_${qId}-${mlt}" ` +
                `data-error="Invalid Answer" ` +
                `data-default="Answer ${qId}-${mlt}">` +
                `Answer ${qId}-${mlt}</label>
        </div>
        <div class="input-field col s2 checkbox-container ` +
            `inline-input center-align">
            <label class="center-align full-width">
                <input id="correct_${qId}-${mlt}" ` +
                    `name="correct_${qId}-${mlt}" ` +
                    `type="checkbox"/>
                <span></span>
            </label>
        </div>`;
    answersContainer.append(answerHtml);
}

// eslint-disable-next-line no-unused-vars
function removeMulti(elem) {
    let prefix = $(elem).closest('.prefix');
    let mlt = parseInt(prefix.attr('data-multi')) - 1;
    let inputField = prefix.closest('.input-field');
    let checkboxContainer = inputField.next();
    let answersContainer = inputField.closest('.answers-container');
    let prevMulti = $(` .prefix[data-multi="${mlt}"]`, answersContainer);

    let controlHtmlRemove = `<a href="#!" onclick="removeMulti(this)">-</a>`;
    let controlHtmlAdd = `<a href="#!" onclick="addMulti(this)">+</a>`;
    let controlHtml;
    if (mlt === 2) {
        controlHtml = controlHtmlAdd;
    } else if (mlt > 2) {
        controlHtml = controlHtmlRemove + controlHtmlAdd;
    }
    prevMulti.html(controlHtml);

    inputField.remove();
    checkboxContainer.remove();
}

function checkBoxMulti(elem) {
    let inputField = $(elem).closest('.checkbox-container');
    let parentRow = inputField.closest('.row');
    let questionTitle = $('.question-title', parentRow);
    let qId = parseInt(questionTitle.attr('data-question'));
    let targetTitle = inputField.next();
    let targetField = targetTitle.next();
    let htmlTitle = `<span class="col s12">What is the Answer?</span>`;
    let htmlContent = `
        <div class="input-field col s12">
            <span class="prefix" data-question="${qId}" data-multi="0"></span>
            <input id="answer_${qId}" name="answer_${qId}" ` +
                `type="text" minlength="1" maxlength="100" class="validate" ` +
                `value="" required>
            <label for="answer_${qId}" data-error="Invalid Answer" ` +
                `data-default="Answer ${qId}">Answer ${qId}` +
                `</label>
        </div>`;
    let multiCount = 0;
    if ($(elem).prop('checked')) {
        multiCount = 1;
        htmlTitle = `<span class="col s10">What are the Choices?</span>` +
            `<span class="col s2 center-align">Correct?</span>`;
        htmlContent = "";
        const buildHtml = () => {
            htmlContent += `
                <div class="input-field col s10">
                    <span class="prefix light-blue-text text-darken-4 ` +
                        `center-align" data-question="${qId}"` +
                        `data-multi="${multiCount}">`;
            if (multiCount === 3) {
                htmlContent += `
                <a href="#!" onclick="removeMulti(this)">-</a>` +
                `<a href="#!" onclick="addMulti(this)">+</a>`;
            }
            htmlContent += `
                    </span>
                    <input id="answer_${qId}-${multiCount}" ` +
                        `name="answer_${qId}-${multiCount}" ` +
                        `type="text" minlength="1" maxlength="100" ` +
                        `class="validate" value="" required>
                    <label for="answer_${qId}-${multiCount}" ` +
                        `data-error="Invalid Answer" ` +
                        `data-default="Answer ${qId}-${multiCount}">` +
                        `Answer ${qId}-${multiCount}</label>
                </div>
                <div class="input-field col s2 checkbox-container ` +
                    `inline-input center-align">
                    <label class="center-align full-width">
                        <input id="correct_${qId}-${multiCount}" ` +
                            `name="correct_${qId}-${multiCount}" ` +
                            `type="checkbox"/>
                        <span></span>
                    </label>
                </div>`;
            if (multiCount < 3) {
                multiCount += 1;
                buildHtml();
            }
        };

        buildHtml();
    }

    targetTitle.html(htmlTitle);
    targetField.html(htmlContent);
}

function checkBoxChanged(elem) {
    let name = $(elem).attr('name');
    switch (name) {
    case 'quizMulti':
        checkBoxMulti(elem);
        break;
    }
}

function listenToCheckbox() {
    $('input[type="checkbox"]').
        on("change", (e) => checkBoxChanged(e.currentTarget));
}

$(function() {
    listenToCheckbox();
    listenToSelect();
    setSelectValue($('#quizCategory'), 'general knowledge');
    setSelectValue($('#roundCategory'), 'general knowledge');
    reinitSelectOnDisabled($('#roundCategory'));
});