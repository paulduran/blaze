﻿function RoomModel(obj, user, chat) {
    var self = this;
    this.currentUserId = ko.computed(function () {
        return user.id();
    });
    this.id = ko.observable(obj.id);
    this.tabId = ko.computed(function () {
        return 'tabs-' + self.id();
    });
    this.roomDomId = ko.computed(function () {
        return 'room-' + self.id();
    });
    this.usersDomId = ko.computed(function () {
        return 'userlist-' + self.id();
    });
    this.name = ko.observable(obj.name);
    this.topic = ko.observable(obj.topic);
    this.updated = ko.observable(obj.updated_at);
    this.users = ko.observableArray([]);
    this.url = ko.computed(function () {
        return '#';
    });
    this.numUsers = ko.computed(function() {
        return '('+self.users().length + ')';
    });
    this.messages = ko.observableArray([]);
    this.refreshRate = ko.observable(30000);    
    this.sendMessage = function (message, isPaste) {
        chat
        //console.log('sending. ' + message + ', paste:' + isPaste);
    };
    this.isActive = ko.observable(false);
    this.isVisible = ko.observable(false);
    this.resetActiveFlag = function() {
        self.isActive(false);
    };    
}
function RoomsModel(chat) {
    var self = this;
    this.rooms = ko.observableArray([]);
    this.roomsByDomId = { };
    this.activeRooms = ko.observableArray([]);   
    this.displayRoom = function (room) {
        if (self.activeRooms.indexOf(room) === -1)
            self.activeRooms.push(room);
        chat.showRoom(room);
    };
    this.inputMessage = ko.observable('');
    this.isPaste = ko.observable(false);
    this.sendMessage = function () {
        if (self.visibleRoom) {
            chat.sendMessage(self.visibleRoom,self.inputMessage(), self.isPaste());
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
                self.isPaste(true);
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
function MessageModel(obj, user, contentProcessor) {
    var self = this;
    var classes = {
        'EnterMessage':'enter-message',
        'KickMessage': 'exit-message',
        'LeaveMessage': 'exit-message',
        'TimestampMessage':'timestamp-message',
        'PasteMessage':'message paste'
    };
    this.id = ko.observable(obj.id);
    this.body = ko.observable(obj.body);
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
        return self.type() !== 'TimestampMessage';
    });
    this.message = ko.computed(function () {
        if (self.type() === 'EnterMessage') {
            return self.trimmedName() + ' has entered the room';
        } else if (self.type() === 'KickMessage' || self.type() === 'LeaveMessage') {
            return self.trimmedName() + ' has left the room';
        } else if (self.type() === 'TimestampMessage') {
            return self.when();
        }
        var body = contentProcessor.process(self.body());
        if(self.type() === 'PasteMessage') {
            return '<pre>' + body + '</pre>';
        } else return body;
    });
    this.isNotification = ko.computed(function() {
        if (self.type() === 'EnterMessage' || self.type() === 'KickMessage' || self.type() === 'LeaveMessage') {
            return true;
        } else return false;
    });
}