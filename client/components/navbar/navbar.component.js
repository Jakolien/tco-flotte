'use strict';
/* eslint no-sync: 0 */

import angular from 'angular';

export class NavbarComponent {

  constructor(Auth, fleets, $translate) {
    'ngInject';
    this.isCollapsed = true;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
    this.fleets = fleets;
    this.use = $translate.use;
  }

}

export default angular.module('directives.navbar', [])
  .component('navbar', {
    template: require('./navbar.pug'),
    controller: NavbarComponent
  })
  .name;
