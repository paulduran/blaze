function Campfire() {
    this.origbase = '/x';
    this.base = this.origbase;
    this.authToken = '';
}

Campfire.prototype.setAccount = function(account) {
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
    var data = { };
    if(lastMessageId !== undefined )
        data['since_message_id'] = lastMessageId;
    $.ajax({
        url: self.base + '/room/' + roomId + '/recent.json',
        data: data,
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function(data) {
            callback(data.messages);
        },
        dataType: 'json'
    });
};

Campfire.prototype.sendMessage = function (roomId, message, isPaste, callback) {
    var self = this;
    if(message === '') {
        callback();
        return;
    }
    var type = isPaste ? 'PasteMessage' : 'TextMessage';
    //var payload = $('<?xml version="1.0"?><payload><message><type><TextMessage></type><body></body></message></payload>');    
    //payload.find('body').text(message);
    //payload = payload.html();
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