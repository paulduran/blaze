function LoginView() {    
}

LoginView.prototype.show = function (account, loginCallback) {
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
    $('#login-form').fadeIn(1000);
};

LoginView.prototype.hide = function () {
    $('#login-form').fadeOut(1000);
};