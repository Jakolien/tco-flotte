'use strict';
import angular from 'angular';

export default class ForgotController {

  /*@ngInject*/
  constructor(Auth, $state, growl, $translate) {
    this.errors = {};
    angular.extend(this, { Auth, $state, growl, $translate });
  }

  forgot(form) {
    this.submitted = true;

    if(form.$valid) {
      this.Auth.forgot(this.email).then( () => {
        // Add a flash message
        this.growl.success(this.$translate.instant('password_reset_sent'));
        // Logged in, redirect to login screen
        this.$state.go('login');
      }).catch(res => {
        this.errors.forgot = (res.data || res).message;
      });
    }
  }

}
