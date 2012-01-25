function Campfire() {
    this.base = '/x';
    this.authToken = '';
}

Campfire.prototype.login = function (username, password, callback) {
    var self = this;
    $.ajax({
        url: self.base + '/users/me.json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic  " + encodeBase64(username + ":" + password));
        },
        success: function (data) {
            self.authToken = data.user.api_auth_token;
            callback(self.authToken);
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

Campfire.prototype.getRecentMessages = function (roomId, callback) {
    var self = this;
    $.ajax({
        url: self.base + '/room/' + roomId + '/recent.json',
        beforeSend: $.proxy(self.setAuthHeader, self),
        success: function(data) {
            callback(data.messages);
        },
        dataType: 'json'
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