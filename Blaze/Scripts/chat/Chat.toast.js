/// <reference path="Scripts/jquery-1.8.0.js" />
/// <reference path="Scripts/desktop-notify.js" />
(function($, basePath) {
    "use strict";

    var toastTimeOut = 10000,
        chromeToast = null,
        toastRoom = null;

    var toast = {
        canToast: function () {
            // we can toast if Notification exist and the user hasn't explicitly denied
            return notify.isSupported;
        },
        ensureToast: function (preferences) {
            if (notify.isSupported && notify.permissionLevel() === notify.PERMISSION_DEFAULT) {
                preferences.canToast = false;
            }
        },
        toastMessage: function(message, roomName) {
            if (!notify.isSupported ||
                notify.permissionLevel() !== notify.PERMISSION_GRANTED) {
                return;
            }

            toastRoom = roomName;

            // Hide any previously displayed toast
            toast.hideToast();

            chromeToast = notify.createNotification(message.trimmedName, {
                icon: basePath + 'Content/images/logo32.png',
                body: $('<div/>').html(message.message).text()
            });

            chromeToast.ondisplay = function () {
                var self = this;
                setTimeout(function () {
                    self.close();
                }, toastTimeOut);
            };

            chromeToast.onclick = function () {
                this.close();
                                
                // Trigger the focus event
                $(document).trigger('toast.focus', [roomName]);

                window.focus();
            };
        },
        hideToast: function () {
            if (chromeToast) {
                chromeToast.close();
            }
        },
        enableToast: function(callback) {
            var deferred = $.Deferred();
            if (notify.isSupported) {
                // If not configured, request permission
                if (notify.permissionLevel() === notify.PERMISSION_DEFAULT) {
                    notify.requestPermission(function () {
                        if (notify.permissionLevel() !== notify.PERMISSION_GRANTED) {
                            deferred.reject();
                        }
                        else {
                            deferred.resolve();
                        }
                    });
                }
                else if (notify.permissionLevel() === notify.PERMISSION_GRANTED) {
                    // If we're allowed then just resolve here
                    deferred.resolve();
                }
                else {
                    // We don't have permission
                    deferred.reject();
                }
            }

            return deferred;
        }
    };
    
    if (!window.chat) {
        window.chat = {};
    }
    window.chat.toast = toast;
})(jQuery, basePath);