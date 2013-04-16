/// <reference path="chatcontroller.js"/>
/// <reference path="~/Scripts/knockout-2.2.1.debug.js"/>
/// <reference path="~/Scripts/chat/Chat.toast.js"/>
/// <reference path="~/Scripts/chat/Chat.emoji.js"/>
/// <reference path="~/Scripts/md5.js"/>

function RoomModel(obj, user, prefs, controller) {
    var self = this;
    this.prefs = prefs;
    this.accessKey = ko.observable('');
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
    this.isOpen = ko.observable(false);
    //this.isActive.extend({ animateOnChange: self });
    this.isVisible = ko.observable(false);
    this.countOffline = ko.observable(false);
    this.hasUnreadPersonalMessages = ko.observable(false);
    this.resetActiveFlag = function () {
        self.unreadMessages(0);
        self.hasUnreadPersonalMessages(false);
        self.isActive(false);
    };
    this.addMessage = function (message) {
        self.messages.push(message);
        if ((!self.isVisible() || self.countOffline()) && !message.isNotification()) {
            self.unreadMessages(self.unreadMessages() + 1);
            if (message.isToCurrentUser()) {
                self.hasUnreadPersonalMessages(true);
            }
            self.isActive(true);
        }
    };
    this.close = function () {
        self.resetActiveFlag();
        self.isOpen(false);
    };
    this.refreshRate = ko.computed(function () {
        if (self.isVisible()) {
            return 10000;
        }
        return 20000;
    });
    this.tabText = ko.computed(function () {
        if (self.isVisible())
            return self.name();
        if (self.isActive()) {
            return '(' + (self.hasUnreadPersonalMessages() ? '*' : '') + self.unreadMessages() + ') ' + self.name();
        }
        return self.name();
    });
    this.constrainTabText = ko.observable(true);
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
    this.toggleSound = function () {
        prefs.sound(!prefs.sound());
        prefs.save();
    };
    this.toggleDesktop = function () {
        if(!prefs.desktop()) {
            chat.toast.enableToast();
        }
        prefs.desktop(!prefs.desktop());
        prefs.save();
    };
    this.canToast = ko.computed(function () {
        return chat.toast.canToast();
    });
    this.origTopic = this.topic();
    this.isEditingTopic = ko.observable(false);
    this.isEditingTopic.subscribe(function () {
        if (self.origTopic != self.topic()) {
            self.origTopic = self.topic();
            controller.changeTopic(self);
        }
    });
    this.topicKeyPress = function (me, e) {
        if (e.which == 13) { // 'enter' key
            self.isEditingTopic(false);
            return false;
        }
        return true;
    },
    this.topicKeyUp = function (me, e) {
        if (e.which === 27) {
            self.topic(self.origTopic);
            self.isEditingTopic(false);
            return false;
        }
        return true;
    },
    this.editTopic = function () {
        self.isEditingTopic(true);
    };   
}

function RoomPreferencesModel(parent,pref) {
    this.id = ko.observable(pref.id);
    this.sound = ko.observable(pref.sound);
    this.desktop = ko.observable(pref.desktop);
    this.save = function () {
        parent.save();
    };
}

function PreferencesModel() {
    var self = this;
    var prefs = $.jStorage.get('chat.preferences');
    if (!prefs) prefs = { };
    this.leftAlignNames = ko.observable(prefs.leftAlignNames);
    this.showAvatars = ko.observable(prefs.showAvatars);
    
    if (prefs.roomPrefs)
        this.roomPrefs = ko.observableArray($.map(prefs.roomPrefs, function (p) { return new RoomPreferencesModel(self, p); })); 
    else
        this.roomPrefs = ko.observableArray([]);
}

PreferencesModel.prototype.getRoomPreferences = function (id) {
    var prefs;
    $.each(this.roomPrefs(), function (i, p) {
        if (p.id() === id) prefs = p;
    });
    if (!prefs) {
        prefs = new RoomPreferencesModel(this, { id: id, sound: false, desktop: false });
        this.roomPrefs.push(prefs);
    }
    return prefs;
};

PreferencesModel.prototype.save = function() {
    var self = this;
    $.jStorage.set('chat.preferences', ko.toJS(self));
};

function RoomsModel(chat) {
    var self = this;
    this.visibleRoom = null;
    this.rooms = ko.observableArray([]);
    this.roomsByDomId = { };
    this.activeRooms = ko.observableArray([]);
    this.showHint = ko.observable(true);
    this.displayRoom = function (room) {
        var newRoom = false;
        if (self.activeRooms.indexOf(room) === -1) {
            newRoom = true;
            self.activeRooms.push(room);
            room.isOpen(true);
        }
        room.resetActiveFlag();
        chat.showRoom(room, newRoom);
    };
    this.leaveRoom = function (room) {
        var idx = self.activeRooms.indexOf(room);        
        if (idx !== -1) {
            room.close();
            chat.leaveRoom(room);
            self.activeRooms.remove(room);
            if (room.isVisible() && idx > 0) {
                chat.showRoom(self.activeRooms()[idx - 1]);
            }
        }
    };
    this.showNextRoom = function () {
        var numRooms = self.activeRooms().length,
            newRoom;
        if (!self.visibleRoom && numRooms > 0) {
            self.displayRoom(self.activeRooms()[0]);
            return;
        }
        $(self.activeRooms()).each(function(i, room) {
            if (room === self.visibleRoom) {
                if ((i + 1) < numRooms) {
                    newRoom = self.activeRooms()[i + 1];
                    self.displayRoom(newRoom);
                }
            }
        });        
    };
    this.showPreviousRoom = function () {
        var numRooms = self.activeRooms().length,
            newRoom;
        if (!self.visibleRoom && numRooms > 0) {
            self.displayRoom(self.activeRooms()[self.activeRooms().length-1]);
            return;
        }
        $(self.activeRooms()).each(function (i, room) {
            if (room === self.visibleRoom) {
                if (i > 0) {
                    newRoom = self.activeRooms()[i - 1];
                    self.displayRoom(newRoom);
                }
            }
        });
    };
    this.inputMessage = ko.observable('');
    this.isPaste = ko.observable(false);
    this.sendMessage = function () {
        if (self.visibleRoom) {
            var isPaste = self.inputMessage().indexOf('\n') !== -1;
            chat.sendMessage(self.visibleRoom, self.inputMessage(), isPaste);
        }
        self.showHint(true);
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
    this.isVisible = function (v) {
        if (self.visibleRoom === null) return;
        if (v) {
            self.visibleRoom.countOffline(false);
            self.visibleRoom.resetActiveFlag();
        } else {
            self.visibleRoom.countOffline(true);            
        }
    };
    this.signOut = function () {
        chat.signOut();
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
    this.email_address = ko.observable(obj.email_address);   
    this.avatar_url = ko.observable(obj.avatar_url);
    this.avatar = ko.computed(function () {
        var url = self.avatar_url();
        if (!url || url.indexOf('missing/avatar.gif') !== -1) {
            if (self.email_address()) {
                if(window.location.protocol === 'https:') {
                    url = 'https://secure.gravatar.com/avatar/' + hex_md5(self.email_address()) + '?s=48&d=mm';
                } else {
                    url = 'http://www.gravatar.com/avatar/' + hex_md5(self.email_address()) + '?s=48&d=mm';
                }
            } else {
                url = 'http://asset0.37img.com/global/missing/avatar.gif?r=3';
            }
        }
        return url.replace("http:", window.location.protocol);
    });
}
function MessageModel(obj, user, currentUser, prevMsg, emoji, chat) {
    var self = this;
    this.chat = chat;
    this.previousMessage = prevMsg;
    this.isLastMessage = ko.observable(false);
    this.id = ko.observable(obj.id);
    this.parsed_body = ko.observable(obj.parsed_body);
    this.type = ko.observable(obj.type);
    this.starred = ko.observable(obj.starred);
    this.created_at = ko.observable(obj.created_at);
    this.description = ko.observable(obj.description);
    this.descriptionIsUrl = function () {
        return self.description().indexOf("http") === 0;
    }
    this.url = ko.observable(obj.url);
    this.when = ko.computed(function () {
        var d = new Date(self.created_at());
        var mins = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
        if (d.getHours() >= 12) {
            var hours = d.getHours() === 12 ? 12 : (d.getHours() - 12); 
            return hours + ':' + mins + ' PM';
        }
        return d.getHours() + ':' + mins + ' AM';
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
    this.isSoundMessage = ko.computed(function () {
        return self.type() === 'SoundMessage';
    });
    this.isTimestamp = ko.computed(function () {
        return self.type() === 'TimestampMessage';
    });
    this.isNotification = ko.computed(function () {
        if (self.type() === 'EnterMessage' || self.type() === 'KickMessage' || self.type() === 'LeaveMessage') {
            return true;
        } else return false;
    });
    this.showUser = ko.computed(function () {
        if (self.isTimestamp())
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
        } else if (self.isTimestamp()) {
            return new Date(self.created_at()).toLocaleDateString();
        } else if (self.type() === 'TweetMessage' && self.parsed_body().indexOf('<a ') != -1) {
            return self.parsed_body().substring(self.parsed_body().indexOf('<a '));
        } else if (self.type() === 'PasteMessage') {
            return self.parsed_body();
        } else if (self.type() === 'SoundMessage') {
            return emoji.parse(self.description());
        }
        var body = emoji.parse(self.parsed_body());

        return body;
    });
    this.isToCurrentUser = ko.computed(function () {
        return (self.message().indexOf('@' + currentUser.name()) != -1) || (self.message().indexOf('@' + currentUser.short_name()) != -1);
    });
    this.isFromCurrentUser = ko.observable(user.id() == currentUser.id());
    this.highlight = ko.computed(function () {
        if (self.isFromCurrentUser()) return 'from_me';
        if (self.isToCurrentUser()) return 'to_me';
        return '';
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
    this.playSound = function () {
        var audio = new Audio(this.url());
        audio.play();
    }
    this.toggleStarred = function () {
        self.starred(!self.starred());
        self.chat.starMessage(self);
        return false;
    };
}