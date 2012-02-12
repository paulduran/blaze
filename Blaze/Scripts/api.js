function Campfire(stealth) {
    this.origbase = '/x';
    this.base = this.origbase;
    this.authToken = '';
    this.account = '';
    this.stealth = stealth;
}

Campfire.prototype.setAccount = function(account) {
    this.account = account;
    this.base = this.origbase + '/' + account;
};

Campfire.prototype.login = function (account, username, password, callback) {
    var self = this;
    self.setAccount(account);
    $.ajax({
        url: self.base + '/users/me.json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic  " + encodeBase64(username + ":" + password));
        },
        success: function (data) {
            self.authToken = data.user.api_auth_token;
            callback(data.user);
        },
        dataType: 'json'
    });
};

Campfire.prototype.getRooms = function (callback) {
    var self = this;
    $.ajax({
        url: self.base + '/rooms.json',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function (data) {
            callback(data.rooms);
        },
        dataType: 'json'
    });
};

Campfire.prototype.getRecentMessages = function (roomId, lastMessageId, callback) {
    var self = this;
    var data = {};
    var base = self.base.replace('/x', '/recent');
    if (lastMessageId !== undefined)
        data['since_message_id'] = lastMessageId;
    $.ajax({
        url: base + '/room/' + roomId + '/recent.json',
        data: data,
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function (reply) {
            callback(reply.messages);
        },
        error: function (xhr, txt, err) {
            console && console.log('getRecentMessages failure: ' + txt + ' (' + err + ')');
            callback([]);
        },
        dataType: 'json'
    });
};

Campfire.prototype.getUploadedMessage = function(roomId, messageId, callback) {
    var self = this;
    $.ajax({
        url: self.base + '/room/' + roomId + '/messages/' + messageId + '/upload.json',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function (reply) {
            callback(reply.upload);
        },
        dataType: 'json'
    });
};

Campfire.prototype.uploadFile = function(roomId, data, callback) {
    // not completed yet!
};

Campfire.prototype.sendMessage = function (roomId, message, isPaste, callback) {
    var self = this;
    if(message === '') {
        callback();
        return;
    }
    var type = '';
    var payload = '<message><type>' + type + '</type><body><![CDATA[' + message + ']]></body></message>';
    $.ajax({
        url: self.base + '/room/' + roomId + '/speak.xml',
        data: payload,
        type: 'POST',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function () {
            callback();
        },
        contentType: 'application/xml',
        dataType: 'xml'
    });
};

Campfire.prototype.getUsers = function (roomId, callback) {
    var self = this;
    $.ajax({
        url: self.base + '/room/' + roomId + '.json',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function (data) {
            callback(data.room.users);
        },
        error: function (xhr, txt, err) {
            console && console.log('getUsers failure: ' + txt + ' (' + err + ')');
            callback([]);
        },
        dataType: 'json'
    });
};

Campfire.prototype.getUser = function (userId, callback) {
    var self = this;
    $.ajax({
        url: self.base + '/users/' + userId + '.json',
        beforeSend: $.proxy(self.setAuthHeader,self),
        success: function (data) {
            callback(data.user);            
        },
        dataType: 'json'
    });
};

Campfire.prototype.setAuthHeader = function (xhr) {
    xhr.setRequestHeader("Authorization", "Basic  " + encodeBase64(this.authToken + ":x"));
};

Campfire.prototype.getAuthorisedUrl = function (url) {
    var self = this;
    return url.replace(/.*campfirenow.com\//, function (h) {
        return '/home/getfile?auth=' + encodeBase64(self.authToken + ":x") + '&account=' + self.account + '&url=';
    });
};

Campfire.prototype.enterRoom = function(roomId, callback) {
    var self = this;
    if (self.stealth) {
        callback();
        return;
    }
    $.ajax({
        url: self.base + '/room/' + roomId + '/join.xml',
        type: 'POST',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function () {
            callback();
        },
        contentType: 'application/xml',
        dataType: 'xml'
    });
};

Campfire.prototype.leaveRoom = function (roomId, callback) {
    var self = this;
    if (self.stealth) {
        callback();
        return;
    }
    $.ajax({
        url: self.base + '/room/' + roomId + '/leave.xml',
        type: 'POST',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function () {
            callback();
        },
        contentType: 'application/xml',
        dataType: 'xml'
    });
};