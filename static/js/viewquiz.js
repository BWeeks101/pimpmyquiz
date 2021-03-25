// eslint-disable-next-line no-unused-vars
function imgLoad(elem) {
    let self = $(elem);
    let img = {
        'height': self.height(),
        'width': self.width()
    };
    let max = 600;
    let val;
    if (img.width > img.height) {
        val = (max / 100) * ((img.height / img.width) * 100);
        self.height(val);

    } else {
        val = (max / 100) * ((img.width / img.height) * 100);
        self.width(val);
    }
    $(self).removeClass('hidden');
}

$(function() {
    $('.quiz-image').each((i, elem) => imgLoad(elem));
});