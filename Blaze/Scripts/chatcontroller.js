/// <reference path="chat.notification.js"/>
/// <reference path="~/Scripts/models.js"/>
/// <reference path="~/Scripts/knockout-2.0.0.js"/>
/**
 * @param {ChatNotifications} notifications
 */
function ChatController(campfire, contentProcessor, view, loginView, notifications, prefs) {
    this.userCache = {};
    this.contentProcessor = contentProcessor;
    this.campfire = campfire;
    this.view = view;
    this.loginView = loginView;
    this.notifications = notifications;
    this.prefs = prefs;
    this.currentUser = null;
    this.roomsModel = null;
}

ChatController.prototype.init = function (accountName) {
    var self = this,
        account = accountName ? accountName : $.cookie('account'),
        authToken;

    this.roomsModel = new RoomsModel(this);
    self.view.init(this.roomsModel, this.campfire);   
    if (account) {
        authToken = $.cookie(account + '_authtoken');
    }
    if (!authToken || !account) {
        self.loginView.init(account);
        self.loginView.show(false, $.proxy(self.login, self));
    } else {
        self.campfire.authToken = authToken;
        self.campfire.setAccount(account);
        self.campfire.login(account, self.campfire.authToken, 'x', function (user) {
            self.showLobby(user);
        });
    }
    $.history.init(function (hash) {
        if (hash.length && hash[0] == '/') {
            hash = hash.substr(1);
        }

        var parts = hash.split('/');
        if (parts[0] === 'rooms') {
            var roomName = parts[1];
            var room = self.roomsModel.roomsByDomId['messages-' + roomName];
            room && self.view.showRoom(room);
        }
    }, { unescape: ',/' });
};

ChatController.prototype.login = function (account, username, password) {
    var self = this;
    self.campfire.login(account, username, password, function (user) {
        $.cookie('account', account, { expires: 1 });
        $.cookie(account + '_authtoken', user.api_auth_token, { expires: 1 });
        self.loginView.hide();
        self.showLobby(user);
    }, function () {
        self.loginView.show(true, $.proxy(self.login, self));
    });
};

ChatController.prototype.showLobby = function (user) {
    var self = this;
    var currentUserModel = new UserModel(user);
    self.currentUser = currentUserModel;
    self.userCache[currentUserModel.id()] = currentUserModel;
    self.view.show();
    self.campfire.getRooms(function (rooms) {
        $.map(rooms, function (o) {
            var roomModel = new RoomModel(o, currentUserModel, self.prefs.getRoomPreferences(o.id));
            self.view.addRoom(roomModel);
            self.loadUsers(roomModel);
        });
        self.campfire.getPresence(function (myRooms) {
            $.each(myRooms, function (i, myRoom) {
                var id = 'messages-' + myRoom.id;
                var roomToJoin = self.roomsModel.roomsByDomId[id];
                self.roomsModel.displayRoom(roomToJoin);
            });
        });
    });
};

ChatController.prototype.loadUsers = function (room) {
    var self = this;
    self.campfire.getUsers(room.id(), function (users) {
        room.users.removeAll();
        $.map(users, function (o) {
            var userModel = new UserModel(o);
            room.users.push(userModel);
            self.userCache[userModel.id()] = userModel;
        });
        self.view.sortRooms();
        setTimeout(function () {
            self.loadUsers(room);
        }, 30000);
    });
};

ChatController.prototype.showRoom = function (room, isNewRoom) {
    var self = this;
    if (isNewRoom) {
        self.campfire.enterRoom(room.id(), function () {
            self.loadMessages(room);
        });
    }
    $.history.load('/rooms/' + room.id());
};

ChatController.prototype.loadMessages = function (room) {
    var self = this;
    var lastMsgId = room.lastMessage ? room.lastMessage.id() : undefined;
    if (room.isLoadingMessages || !room.isOpen()) return;
    room.isLoadingMessages = true;
    self.campfire.getRecentMessages(room.id(), lastMsgId, function (messages) {
        room.isLoadingMessages = false;
        var numNewMessages = 0;
        $.each(messages, function (i, o) {
            var user = o.user_id ? self.getUser(o.user_id) : new UserModel({ id: 0, name: '' });
            var isSeparator = self.checkForSeparator(o, room.lastMessage);
            if (o.type !== 'TimestampMessage' || isSeparator) {
                var messageModel = new MessageModel(o, user, self.currentUser, room.lastMessage, self.contentProcessor);
                room.addMessage(messageModel);
                room.lastMessage = messageModel;
                if (!isSeparator) {
                    numNewMessages++;
                }
                if (messageModel.type() === 'UploadMessage') {
                    self.campfire.getUploadedMessage(room.id(), o.id, function (up) {
                        messageModel.parsed_body(self.getBodyForUploadedMessage(up));
                    });
                }
            }
        });
        if (numNewMessages > 0) {
            self.notifications.notify(room, ko.toJS(room.lastMessage));
            if (room.isVisible()) {
                self.view.scrollToEnd();
            }
        }
        if (room.timer) {
            clearTimeout(room.timer);
        }
        room.timer = setTimeout(function () {
            self.loadMessages(room);
        }, room.refreshRate());
    });
};

ChatController.prototype.getBodyForUploadedMessage = function (up) {
    var self = this;
    var url = self.campfire.getAuthorisedUrl(up.full_url);
    if (up.content_type === 'image/jpeg' || up.content_type === 'image/jpg' || up.content_type === 'image/png' || up.content_type === 'image/gif' || up.content_type === 'image/bmp') {
        return '<div class="collapsible_content"><h3 class="collapsible_title">' + up.name + ' (click to show/hide)</h3><div class="collapsible_box"><img src="' + url + '" class="uploadImage"/></div></div>';
    }
    return '<a href="' + url + '" target="_blank" rel="nofollow external" class="file-upload">' + up.name + '</a>';
};

ChatController.prototype.checkForSeparator = function (newMsg, oldMsg) {
    if (newMsg.type === 'TimestampMessage' && oldMsg) {
        var oldDate = new Date(oldMsg.created_at()).toDate();
        var newDate = new Date(newMsg.created_at).toDate();
        if (oldDate.diffDays(newDate))
            return true;
    }
    return false;
};

ChatController.prototype.getUser = function (id) {
    var self = this;
    if (self.userCache[id] !== undefined) {
        return (self.userCache[id]);
    } else {
        var model = new UserModel({ id: id, name: '' });
        self.userCache[id] = model;
        self.campfire.getUser(id, function (user) {
            model.name(user.name);
            model.email_address(user.email_address);
            model.avatar_url(user.avatar_url);
        });
        return model;
    }
};

ChatController.prototype.sendMessage = function(room, message, isPaste) {
    var self = this;
    self.campfire.sendMessage(room.id(), message, isPaste, function() {
        self.loadMessages(room);
    });
};

ChatController.prototype.leaveRoom = function (room) {
    var self = this;
    self.campfire.leaveRoom(room.id(), function () {
    });
};

