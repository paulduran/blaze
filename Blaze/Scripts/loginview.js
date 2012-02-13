function LoginView() {    
}

LoginView.prototype.init = function(account) {
    this.loginModel = {
        username: ko.observable(''),
        password: ko.observable(''),
        account: ko.observable(account),
        showError: ko.observable(false),
        loginText: ko.observable('Login'),
        enabled: ko.observable(true),
        login: function () {
            var self = this;
            self.showError(false);
            self.loginText('Please Wait...');
            self.enabled(false);
            self.loginCallback(self.account(), self.username(), self.password());
        },
        checkForSubmit: function (data, e) {
            var self = this;
            if (e.keyCode === 13) {
                self.login();
                return false;
            }
            return true;
        }
    };
};

LoginView.prototype.show = function (showError, loginCallback) {
    this.loginModel.showError(showError);
    this.loginModel.loginText('Login');
    this.loginModel.enabled(true);
    if(!showError) {
        this.loginModel.loginCallback = loginCallback;
        ko.applyBindings(this.loginModel, document.getElementById('login-form'));
        $('#login-form').fadeIn(1000);
    }
};

LoginView.prototype.hide = function () {
    $('#login-form').fadeOut(1000);
};