function ChatController(campfire, contentProcessor, view, loginView) {
    this.userCache = {};
    this.contentProcessor = contentProcessor;
    this.campfire = campfire;
    this.view = view;
    this.loginView = loginView;
}

ChatController.prototype.init = function (accountName) {
    var self = this,
        account = accountName ? accountName : $.cookie('account'),
        authToken;

    self.view.init(new RoomsModel(this));
    if (account) {
        authToken = $.cookie(account + '_authtoken');
    }
    if (!authToken || !account) {
        self.loginView.show(account, $.proxy(self.login, self));
    } else {
        self.campfire.authToken = authToken;
        self.campfire.setAccount(account);
        self.campfire.login(account, self.campfire.authToken, 'x', function (user) {
            self.showLobby(user);
        });
    }
};

ChatController.prototype.login = function (account, username, password) {
    var self = this;
    self.campfire.login(account, username, password, function (user) {
        $.cookie('account', account, { expires: 1 });
        $.cookie(account + '_authtoken', user.api_auth_token, { expires: 1 });
        self.loginView.hide();
        self.showLobby(user);
    });
};

ChatController.prototype.showLobby = function (user) {
    var self = this;
    var currentUserModel = new UserModel(user);
    self.userCache[currentUserModel.id()] = currentUserModel;
    self.view.show();
    self.campfire.getRooms(function (rooms) {
        $.map(rooms, function (o) {
            var roomModel = new RoomModel(o, currentUserModel, self);
            self.view.addRoom(roomModel);
            self.loadUsers(roomModel);
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

ChatController.prototype.showRoom = function (room) {
    var self = this;
    self.loadMessages(room, true);
    self.view.showRoom(room);
};

ChatController.prototype.loadMessages = function (room, autorefresh) {
    var self = this;
    var lastMsgId = room.lastMessage ? room.lastMessage.id() : undefined;
    self.campfire.getRecentMessages(room.id(), lastMsgId, function (messages) {
        var hasContent = false;
        $.map(messages, function (o) {
            var user = o.user_id ? self.getUser(o.user_id) : new UserModel({ id: 0, name: '' });
            var messageModel = new MessageModel(o, user, room.lastMessage, self.contentProcessor);
            if( messageModel.type() !== 'TimestampMessage')
                room.messages.push(messageModel);
            room.lastMessage = messageModel;
            hasContent = true;
        });
        if (hasContent) {
           /* $('#chat-area').linkify(function (links) {
                links.addClass('linkified');
                links.attr('target', '_blank');
            });*/
            room.isActive(true);
            if (room.isVisible())
                self.view.scrollToEnd();
        }
        if (autorefresh === true) {
            room.timer = setTimeout(function () {
                self.loadMessages(room, true);
            }, room.refreshRate());
        }
    });
};

ChatController.prototype.getUser = function(id) {
    var self = this;
    if (self.userCache[id] !== undefined) {
        return (self.userCache[id]);
    } else {
        var model = new UserModel({ id: id, name: '' });
        self.userCache[id] = model;
        self.campfire.getUser(id, function(user) {
            model.name(user.name);
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

