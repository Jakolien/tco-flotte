'use strict';

export default class SettingsController {

  /*@ngInject*/
  constructor(Auth, growl, $translate) {
    this.Auth = Auth;
    this.growl = growl;
    this.$translate = $translate;
    this.errors = {};
  }

  changePassword(form) {
    this.submitted = true;
    delete this.errors.other;

    if(form.$valid) {
      this.Auth.changePassword(this.user.oldPassword, this.user.newPassword)
        .then(() => {
          this.growl.success(this.$translate.instant('password_changed'));
        })
        .catch(() => {
          this.errors.other = this.$translate.instant('password_not_correct');
        });
    }
  }
}
