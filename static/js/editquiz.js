/* global popChangeConfModal */

function listenToCollapsibleHeaders() {
    $('.collapsible-header').on('click', (e) => {
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

function listenToCancelEditUrl() {
    $('#cancelEdit').on('click', (e) => {
        e.preventDefault();
        popChangeConfModal('c', e.currentTarget);
    });
}

$(function () {
    listenToCancelEditUrl();
    listenToCollapsibleHeaders();
});