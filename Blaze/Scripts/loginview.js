function LoginView() {    
}

LoginView.prototype.show = function (account, loginCallback) {
    $('#login-form').show().modal({
        keyboard: false
    });
    var loginModel = {
        username: ko.observable(''),
        password: ko.observable(''),
        account: ko.observable(account),
        login: function () {
            var self = this;
            loginCallback(self.account(), self.username(), self.password());
        }
    };
    ko.applyBindings(loginModel, document.getElementById('login-form'));
};

LoginView.prototype.hide = function() {
    $('#login-form').hide();
};