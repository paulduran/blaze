function ChatView() {
    this.visibleRoom = null;
    this.roomsModel = null;
}

ChatView.prototype.init = function (roomsModel) {
    var self = this;
    self.roomsModel = roomsModel;
    ko.applyBindings(self.roomsModel, document.getElementById('messages-lobby'));
    ko.applyBindings(self.roomsModel, document.getElementById('tabs'));

    $('.tabs').bind('change', function (e) {
        var domId = $(e.target).attr('href');
        if (domId === '#lobby') return;
        self.changeRoom(domId);
    });
    $('.input-message').live('keydown', function (e) {
        if (e.keyCode === 13 && e.ctrlKey) {
            $(this).insertAtCaret('\n');
        }
    });
    $('#tabs li').live('click', function () {
        var name = $(this).data('name');
        self.changeRoom(name);
    });
};

ChatView.prototype.addRoom = function(roomModel) {
    var self = this;
    self.roomsModel.rooms.push(roomModel);
    self.roomsModel.roomsByDomId[roomModel.domId()] = roomModel;
};

ChatView.prototype.changeRoom = function (roomId) {
    var self = this;
    if (self.visibleRoom != null) self.visibleRoom.isVisible(false);
    $('#chat-area .current').hide();
    $('.current').removeClass('current');
    var room = self.roomsModel.roomsByDomId['#room-' + roomId];
    if(room) {
        room.isVisible(true);
        self.visibleRoom = room;        
    } else {
        // lobby
        self.visibleRoom = null;
        $('#tab-' + roomId).addClass('current');
        $('#messages-' + roomId).addClass('current').show();
        $('#userlist-' + roomId).addClass('current').show();
    }
    self.scrollToEnd();
};

ChatView.prototype.show = function () {
    $('.header-wrap').show();
    $('#ie6-container-wrap').show();
};

ChatView.prototype.showRoom = function (room) {
    var self = this;
    if ($(room.domId()).length == 0) {
        var roomDom = $('#room-template').clone();
        roomDom.attr('id', 'messages-' + room.id());
        $('#room-template').parent().append(roomDom);

        $(roomDom).each(function (i, r) {
            ko.applyBindings(room, r);
        });
        var usersDom = $('#userlist-template').clone();
        usersDom.attr('id', 'userlist-' + room.id());
        $('#userlist-template').parent().append(usersDom);

        $(usersDom).each(function (i, r) {
            ko.applyBindings(room, r);
        });


        self.changeRoom(room.id());
    }
};

ChatView.prototype.sortRooms = function() {
    this.roomsModel.rooms.sort(function(l, r) {
        if (l.users().length == r.users().length) return 0;
        if (l.users().length < r.users().length) return 1;
        return -1;
    });
};

ChatView.prototype.scrollToEnd = function () {
    if (this.visibleRoom != null) {
        console.log('scrolling to end for #messages-' + this.visibleRoom.id());
        $('#messages-' + this.visibleRoom.id()).scrollTo('max');
    }
};
