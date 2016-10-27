'use strict';

export default class ResetController {

  /*@ngInject*/
  constructor(Auth, $state, $stateParams, growl, $translate) {
    this.errors = {};
    angular.extend(this, { Auth, $state, growl, $translate, $stateParams });
  }

  reset(form) {
    this.submitted = true;

    if(form.$valid) {
      this.Auth.reset(this.password, this.$stateParams.token).then( () => {
        // Add a flash message
        this.growl.success(this.$translate.instant('password_reset_confirm'));
        // Logged in, redirect to login screen
        this.$state.go('login');
      }).catch(res => {
        this.errors.reset = (res.data || res).message;
      });
    }
  }
}
