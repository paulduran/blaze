function RoomModel(obj, user, chat) {
    var self = this;
    this.currentUserId = ko.computed(function () {
        return user.id();
    });
    this.id = ko.observable(obj.id);
    this.tabId = ko.computed(function () {
        return 'tabs-' + self.id();
    });
    this.roomDomId = ko.computed(function () {
        return 'messages-' + self.id();
    });
    this.usersDomId = ko.computed(function () {
        return 'userlist-' + self.id();
    });
    this.name = ko.observable(obj.name);
    this.topic = ko.observable(obj.topic);
    this.updated = ko.observable(obj.updated_at);
    this.users = ko.observableArray([]);
    this.numUsers = ko.computed(function() {
        return '('+self.users().length + ')';
    });
    this.messages = ko.observableArray([]);
    this.unreadMessages = ko.observable(0);
    this.unreadMessages.extend({ updateTitle: '' });
    this.isActive = ko.observable(false);
    this.isActive.extend({ animateOnChange: self });
    this.isVisible = ko.observable(false);
    this.resetActiveFlag = function () {
        self.unreadMessages(0);
        self.isActive(false);
    };
    this.addMessage = function (message) {
        self.messages.push(message);
        if (!self.isVisible() && !message.isNotification()) {
            self.unreadMessages(self.unreadMessages() + 1);
            self.isActive(true);
        }
    };
    this.refreshRate = ko.computed(function () {
        if (self.isVisible()) {
            return 5000;
        }
        return 20000;
    });
    this.tabText = ko.computed(function () {
        if (self.isVisible())
            return self.name();
        if (self.isActive()) {
            return '(' + self.unreadMessages() + ') ' + self.name();
        }
        return self.name();
    });
    this.collapseNotifications = function (element, i, msg) {
        var count = 0;
        while (i > 0 && self.messages()[i].isNotification()) {
            count++;
            i--;
            if (count > 3) {
                msg.collapse();
                return;
            }
        }
    };   
}
function RoomsModel(chat) {
    var self = this;
    this.rooms = ko.observableArray([]);
    this.roomsByDomId = { };
    this.activeRooms = ko.observableArray([]);
    this.displayRoom = function (room) {
        var newRoom = false;
        if (self.activeRooms.indexOf(room) === -1) {
            newRoom = true;
            self.activeRooms.push(room);
        }
        room.resetActiveFlag();
        chat.showRoom(room, newRoom);
    };
    this.leaveRoom = function (room) {
        var idx = self.activeRooms.indexOf(room);
        if (idx !== -1) {
            self.activeRooms.remove(room);
            if (idx > 0) {
                chat.showRoom(self.activeRooms[idx - 1]);
            }
        }
    };
    this.inputMessage = ko.observable('');
    this.isPaste = ko.observable(false);
    this.sendMessage = function () {
        if (self.visibleRoom) {
            var isPaste = self.inputMessage().indexOf('\n') !== -1;
            chat.sendMessage(self.visibleRoom,self.inputMessage(), isPaste);
        }
        self.inputMessage('');
        self.isPaste(false);
    };
    this.onKeyDown = function (data, e) {
        if (e.keyCode === 13) {
            if (!e.ctrlKey) {
                self.sendMessage();
                return false;
            } else {
          //      self.isPaste(true);
            }
        }
        return true;
    };
    this.onPaste = function (data, e) {
        self.isPaste(true);
        return true;
    };   
}
function UserModel(obj) {
    var self = this;
    this.id = ko.observable(obj.id);
    this.name = ko.observable(obj.name);
    this.short_name = ko.computed(function () {
        return self.name().replace(/\s+([^\s]+)/g, function (str) {
            return ' ' + str.substring(1, 2) + '.';
        });
    });
    if (!obj.avatar_url) {
        obj.avatar_url = 'http://asset0.37img.com/global/missing/avatar.gif?r=3'; 
    }
    this.avatar_url = ko.observable(obj.avatar_url);
}
function MessageModel(obj, user, prevMsg, contentProcessor) {
    var self = this;
    this.previousMessage = prevMsg;
    var classes = {
        'EnterMessage':'enter-message',
        'KickMessage': 'exit-message',
        'LeaveMessage': 'exit-message',
        'TimestampMessage':'timestamp-message',
        'PasteMessage':'message paste'
    };
    this.id = ko.observable(obj.id);
    this.parsed_body = ko.observable(obj.parsed_body);
    this.type = ko.observable(obj.type);
    this.css_class = ko.computed(function () {
        var cls = classes[self.type()];
        if (cls) return cls;
        return 'message ' + self.type();
    });
    this.starred = ko.observable(obj.starred);
    this.created_at = ko.observable(obj.created_at);
    this.when = ko.computed(function () {
        var d = new Date(self.created_at());
        var mins = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
        return d.getHours() + ':' + mins;
    });
    this.user = user;
    this.userId = ko.computed(function () {
        return self.user.id();
    });
    this.trimmedName = ko.computed(function() {
        return self.user.short_name();
    });
    this.username = ko.computed(function () {
        return self.user.name();
    });
    this.showUser = ko.computed(function () {
        if (self.type() === 'TimestampMessage')
            return false;
        if (self.previousMessage === undefined)
            return true;
        if(self.previousMessage.isNotification())
            return true;
        return self.user != self.previousMessage.user;            
    });
    this.message = ko.computed(function () {
        if (self.type() === 'EnterMessage') {
            return self.trimmedName() + ' has entered the room';
        } else if (self.type() === 'KickMessage' || self.type() === 'LeaveMessage') {
            return self.trimmedName() + ' has left the room';
        } else if (self.type() === 'TimestampMessage') {
            return self.when();
        }
        var body = contentProcessor.process(self.parsed_body());
        return body;
    });
    this.isNotification = ko.computed(function() {
        if (self.type() === 'EnterMessage' || self.type() === 'KickMessage' || self.type() === 'LeaveMessage') {
            return true;
        } else return false;
    });
    this.collapseText = ko.observable('');
    this.isVisible = ko.observable(true);
    this.toggleCollapse = function () {
        if (self.collapseText().indexOf('to expand') !== -1) {
            self.expand();
        } else {
            self.collapse();
        }
    };
    this.collapse = function () {
        var count = 0;
        var prev = self.previousMessage;
        while (prev && prev.isNotification()) {
            prev.collapseText('');
            prev.isVisible(false);
            prev = prev.previousMessage;
            count++;
        }
        this.collapseText(' (plus ' + count + ' hidden... click to expand)');
    };
    this.expand = function () {
        this.collapseText(' (click to collapse)');
        var prev = self.previousMessage;
        while (!prev.isVisible()) {
            prev.isVisible(true);
            prev = prev.previousMessage;
        }
    };
}