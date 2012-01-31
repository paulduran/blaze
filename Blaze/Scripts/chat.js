function Chat(campfire, contentProcessor) {
    this.userCache = {};
    this.contentProcessor = contentProcessor;
    this.campfire = campfire;
    this.roomsModel = new RoomsModel(this);
    this.visibleRoom = null;
}

Chat.prototype.init = function (accountName) {
    var self = this,
        account = accountName ? accountName : $.cookie('account'),
        authToken;

    if (account) {
        authToken = $.cookie(account + '_authtoken');
    }
    if (!authToken || !account) {
        self.showLogin(account);
    } else {
        self.campfire.authToken = authToken;
        self.campfire.setAccount(account);
        self.campfire.login(account, self.campfire.authToken, 'x', function (user) {
            self.showRooms(user);
        });
    }
    $('.tabs').bind('change', function (e) {
        if (self.visibleRoom != null) self.visibleRoom.isVisible(false);
        var domId = $(e.target).attr('href');
        if (domId === '#lobby') return;
        self.roomsModel.roomsByDomId[domId].isVisible(true);
        self.scrollToEnd();
    });
};

Chat.prototype.showLogin = function (account) {
    $('#login-form').show();
    var chat = this;
    var loginModel = {
        username: ko.observable(''),
        password: ko.observable(''),
        account: ko.observable(account),
        login: function () {
            var self = this;
            chat.campfire.login(self.account(), self.username(), self.password(), function (user) {
                $.cookie('account', self.account(), { expires: 1 });
                $.cookie(self.account() + '_authtoken', user.api_auth_token, { expires: 1 });
                $('#login-form').hide();
                chat.showRooms(user);
            });
        }
    };
    ko.applyBindings(loginModel, document.getElementById('login-form'));
};

Chat.prototype.showRooms = function (user) {
    var self = this;
    $('.header-wrap').show();
    $('#ie6-container-wrap').show();
    var currentUserModel = new UserModel(user);
    self.userCache[currentUserModel.id()] = currentUserModel;

    ko.applyBindings(self.roomsModel, document.getElementById('lobby'));
    ko.applyBindings(self.roomsModel, document.getElementById('tabs'));
    self.campfire.getRooms(function (rooms) {
        $.map(rooms, function (o) {
            var roomModel = new RoomModel(o, currentUserModel);
            self.roomsModel.rooms.push(roomModel);
            self.roomsModel.roomsByDomId[roomModel.domId()] = roomModel;
            self.loadUsers(roomModel);
        });
    });
};

Chat.prototype.loadUsers = function (room) {
    var self = this;
    self.campfire.getUsers(room.id(), function (users) {
        room.users.removeAll();
        $.map(users, function (o) {
            var userModel = new UserModel(o);
            room.users.push(userModel);
            self.userCache[userModel.id()] = userModel;
        });
        self.roomsModel.rooms.sort(function (l, r) {
            if (l.users().length == r.users().length) return 0;
            if (l.users().length < r.users().length) return 1;
            return -1;
        });
        setTimeout(function () {
            self.loadUsers(room);
        }, 30000);
    });
};

Chat.prototype.showRoom = function (room) {
    var self = this;
    if ($(room.domId()).length == 0) {
        var roomDom = $('#room').clone();
        roomDom.attr('id', 'room-' + room.id());
        $('#room').parent().append(roomDom);

        $(roomDom).each(function (i, r) {
            ko.applyBindings(room, r);
        });
        self.loadMessages(room, true);
    }
};

Chat.prototype.loadMessages = function (room, autorefresh) {
    var self = this;
    self.campfire.getRecentMessages(room.id(), room.lastMessageId, function (messages) {
        var hasContent = false;
        $.map(messages, function (o) {
            var user = o.user_id ? self.getUser(o.user_id) : new UserModel({ id: 0, name: '' });
            var messageModel = new MessageModel(o, user, self.contentProcessor);
            room.messages.push(messageModel);
            room.lastMessageId = messageModel.id();
            hasContent = true;
        });
        if (hasContent) {
            $('.content').linkify(function (links) {
                links.addClass('linkified');
                links.attr('target', '_blank');
            });
            room.isActive(true);
            if (room.isVisible())
                self.scrollToEnd();
        }
        if (autorefresh === true) {
            room.timer = setTimeout(function () {
                self.loadMessages(room, true);
            }, room.refreshRate());
        }
    });
};

Chat.prototype.getUser = function(id) {
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



Chat.prototype.sendMessage = function(room, message) {
    var self = this;
    self.campfire.sendMessage(room.id(), message, function() {
        self.loadMessages(room);
    });
};

Chat.prototype.scrollToEnd = function() {
    $(document).scrollTo('max');
};

