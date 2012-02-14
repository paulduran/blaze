/// <reference path="models.js"/>
/// <reference path="knockout-2.0.0.js"/>
function ChatView() {
    this.roomsModel = null;
}

ChatView.prototype.init = function (roomsModel) {
    var self = this;
    self.roomsModel = roomsModel;

    ko.extenders.animateOnChange = function (target, room) {
        target.subscribe(function (newValue) {
            if (newValue === true)
                self.glowTab(room);
        });
    };
    ko.extenders.updateTitle = function (target) {
        target.subscribe($.proxy(self.updateTitle, self));
    };

    ko.applyBindings(self.roomsModel, document.getElementById('page'));

    $('#new-message').live('keydown', function (e) {
        if (e.keyCode === 13 && e.ctrlKey) {
            $(this).insertAtCaret('\n');
        }
    });
    $('#tabs-lobby').live('click', function () {
        var name = $(this).data('name');
        self.changeRoom(name);
    });
    $(document).on('click', 'h3.collapsible_title', function () {
        var nearEnd = self.isNearTheEnd();
        $(this).next().toggle(0, function () {
            if (nearEnd) {
                self.scrollToEnd();
            }
        });
    });
    $('#new-message').autoTabComplete({
        prefixMatch: '[@]',
        get: function (prefix) {
            switch (prefix) {
                case '@':
                    var room = self.roomsModel.visibleRoom;
                    if (room) {
                        // todo: exclude current username from autocomplete
                        return room.users().map(function (u) { return u.short_name(); });
                    }
                default:
                    return [];
            }
        }
    });
    $(window).blur(function () {
        self.roomsModel.isVisible(false);
    });
    $(window).focus(function () {
        self.roomsModel.isVisible(true);
        self.updateTitle();
    });
};

ChatView.prototype.updateTitle = function () {
    var self = this;
    var total = 0;
    var personal = false;
    $(self.roomsModel.rooms()).each(function (i, room) {
        total += room.unreadMessages();
        personal |= room.hasUnreadPersonalMessages();
    });
    var title = 'Blaze';
    if (total > 0) {
        title = '(' + (personal ? '*' : '') +  total + ') Blaze';
    }
    if (self.titleTimeout) {
        clearTimeout(self.titleTimeout);
    }
    self.titleTimeout = setTimeout(function () {
        document.title = title;
    }, 500);
};

/** 
  * @param {RoomModel} room  room to glow tab for 
  */
ChatView.prototype.glowTab = function (room) {
    var self = this;
    var $tab = $('#' + room.tabId());

    // Stop if we're not unread anymore
    if (!room.isActive()) {
        $tab.attr({ style: '' });
        return;
    }

    // Go light
    $tab.animate({ backgroundColor: '#e5e5e5', color: '#000000' }, 800, function () {
        // Stop if we're not unread anymore
        if (!room.isActive()) {
            $tab.attr({ style: '' });
            return;
        }

        // Go dark
        $tab.animate({ backgroundColor: '#164C85', color: '#ffffff' }, 800, function () {
            // Glow the tab again
            self.glowTab(room);
        });
    });
};

ChatView.prototype.addRoom = function(roomModel) {
    var self = this;
    self.roomsModel.rooms.push(roomModel);
    self.roomsModel.roomsByDomId[roomModel.roomDomId()] = roomModel;
};

ChatView.prototype.changeRoom = function (roomId) {
    var self = this;
    if (self.roomsModel.visibleRoom != null) {
        self.roomsModel.visibleRoom.isVisible(false);
        self.roomsModel.visibleRoom = null;
    }
    $('#chat-area .current').hide();
    $('.current').removeClass('current');
    var room = self.roomsModel.roomsByDomId['messages-' + roomId];
    if (room) {
        room.isVisible(true);
        self.roomsModel.visibleRoom = room;
    } else {
        // lobby        
        $('#tabs-' + roomId).addClass('current');
        $('#messages-' + roomId).addClass('current').show();
        $('#userlist-' + roomId).addClass('current').show();
    }
    self.scrollToEnd();
};

ChatView.prototype.show = function () {
    $('#page').fadeIn(1000);    
};

ChatView.prototype.showRoom = function (room) {
    var self = this;
    if ($(room.roomDomId()).length == 0) {
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

ChatView.prototype.isNearTheEnd = function () {
    if (this.roomsModel.visibleRoom != null) {
        var msgs = $('#messages-' + this.roomsModel.visibleRoom.id());
        return msgs[0].scrollTop + msgs.height() >= msgs[0].scrollHeight;
    }
    return false;
};

ChatView.prototype.scrollToEnd = function () {
    if (this.roomsModel.visibleRoom != null) {
        console && console.log('scrolling to end for #messages-' + this.roomsModel.visibleRoom.id());
        // $('#messages-' + this.roomsModel.visibleRoom.id()).scrollTo('max');
        var msgs = $('#messages-' + this.roomsModel.visibleRoom.id());
        msgs.scrollTop(msgs[0].scrollHeight);
    }
};
