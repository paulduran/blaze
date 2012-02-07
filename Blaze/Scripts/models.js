function RoomModel(obj, user, chat) {
    var self = this;
    this.currentUserId = ko.computed(function () {
        return user.id();
    });
    this.id = ko.observable(obj.id);
    this.domId = ko.computed(function () {
        return '#room-' + self.id();
    });
    this.name = ko.observable(obj.name);
    this.topic = ko.observable(obj.topic);
    this.updated = ko.observable(obj.updated_at);
    this.users = ko.observableArray([]);
    this.url = ko.computed(function () {
        return '#';
    });
    this.messages = ko.observableArray([]);
    this.refreshRate = ko.observable(30000);
    this.isPaste = ko.observable(false);
    this.inputMessage = ko.observable('');
    this.sendMessage = function () {
        chat.sendMessage(self, self.inputMessage(), self.isPaste());
        //console.log('sending. paste:' + self.isPaste());
        self.inputMessage('');
        self.isPaste(false);
    };
    this.isActive = ko.observable(false);
    this.isVisible = ko.observable(false);
    this.resetActiveFlag = function() {
        self.isActive(false);
    };
    this.onKeyDown = function(data,e) {
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
    this.onPaste = function (data,e) {
        self.isPaste(true);
        return true;
    };
}
function RoomsModel(chat) {
    var self = this;
    this.rooms = ko.observableArray([]);
    this.roomsByDomId = { };
    this.activeRooms = ko.observableArray([]);   
    this.displayRoom = function (room) {
        chat.showRoom(room);
        if (self.activeRooms.indexOf(room) === -1)
            self.activeRooms.push(room);
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
    this.nice_created = ko.computed(function () {
        var d = new Date(self.created_at());
        var mins = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
        return d.getHours() + ':' + mins;
    });
    this.user = user;
    this.userId = ko.computed(function () {
        return self.user.id();
    });
    this.username = ko.computed(function () {
        return self.user.short_name();
    });
    this.parsed_body = ko.computed(function () {
        if (self.type() === 'EnterMessage') {
            return ' has entered the room';
        } else if (self.type() === 'KickMessage' || self.type() === 'LeaveMessage') {
            return ' has left the room';
        } else if (self.type() === 'TimestampMessage') {
            return self.nice_created();
        }
        var body = contentProcessor.process(self.body());
        if(self.type() === 'PasteMessage') {
            return '<pre>' + body + '</pre>';
        } else return body;
    });

}