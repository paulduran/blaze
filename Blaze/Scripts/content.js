function ContentProcessor(emojis) {
    this.emojis = emojis;
}

ContentProcessor.prototype.process = function (body) {
    var parsers = [
        this.processEmoji
//        this.processImage,
//        this.processYoutube
    ];

    if (!body) return null;
    $.each(parsers, function (i, p) {
        body = p(body);
    });
    return body;
};

ContentProcessor.prototype.processEmoji = function (body) {
    var self = this;
    return body.replace(/:[a-z0-9]+:/ig, function (str) {
        var emoji = self.emojis[str];
        if (emoji !== undefined) {
            return '<img class="emoji" src="' + emoji + '"/>';
        } else {
            return str;
        }
    });
};

ContentProcessor.prototype.processYoutube = function (body) {
    return body.replace(/http:\/\/www.youtube.com\/watch\?v=([^&]+)/ig, function (str) {
        return '<a class="youtube" href="' + str + '" target="_blank"><img src="' + $.jYoutube(str, 'small') + '"/></a>';
    });
};

ContentProcessor.prototype.processImage = function (body) {
    return body.replace(/https?:\/\/(?:[a-z0-9\-]+\.)+[a-z]{2,6}(?:\/[^/#?]+)+\.(?:jpg|gif|png)/ig, function (str) {
        return '<img class="image" src="' + str + '"/>';
    });
};