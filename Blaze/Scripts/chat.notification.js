ChatNotifications = function (prefs) {
    this.prefs = prefs;
};

ChatNotifications.prototype.notify = function (room, message) {
    var prefs = this.prefs.getRoomPreferences(room.id());
    if (prefs.sound()) {
        $('#notificationSound')[0].play();
    }
    if (prefs.desktop()) {
        chat.toast.toastMessage(message, room.name());
    }
};
