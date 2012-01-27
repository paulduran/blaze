function RoomModel(obj) {
    var self = this;
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
    this.message = ko.observable('');
    this.sendMessage = function () {
        sendMessage(self, self.message());
    };
}
function RoomsModel() {
    var self = this;
    this.rooms = ko.observableArray([]);
    this.activeRooms = ko.observableArray([]);
    this.displayRoom = function (room) {
        showRoom(room);
        //$('body').tabs('ul[data-tabs] li > a, ul[data-pills] > li > a');
        if (self.activeRooms.indexOf(room) === -1)
            self.activeRooms.push(room);
    };
}
function UserModel(obj) {
    this.id = ko.observable(obj.id);
    this.name = ko.observable(obj.name);
}
function MessageModel(obj, user) {
    var self = this;
    this.id = ko.observable(obj.id);
    this.body = ko.observable(obj.body);
    this.parsed_body = ko.computed(function() {
        return processBody(self.body());
    });
    this.type = ko.observable(obj.type);
    this.starred = ko.observable(obj.starred);
    this.created_at = ko.observable(obj.created_at);
    this.nice_created = ko.computed(function () {
        var d = new Date(self.created_at());
        var mins = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
        return d.getHours() + ':' + mins;
    });
    this.user = user;    
    this.username = ko.computed(function () {
        return self.user.name();
    });
}