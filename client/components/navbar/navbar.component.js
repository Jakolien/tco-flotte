'use strict';
/* eslint no-sync: 0 */

import angular from 'angular';

export class NavbarComponent {

  constructor(Auth) {
    'ngInject';
    this.isCollapsed = true;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
    // Add elements to the menu
    this.menu = [
      { state: 'main', title: 'Home' },
      { state: 'main.fleets', title: 'My fleets' },
      { state: 'main.visualization', title: 'Visualization' }
    ];
  }

}

export default angular.module('directives.navbar', [])
  .component('navbar', {
    template: require('./navbar.html'),
    controller: NavbarComponent
  })
  .name;
