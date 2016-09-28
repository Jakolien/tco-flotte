'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routes from './fleets.routes';

export class FleetsComponent {
  /*@ngInject*/
  constructor() {
    this.message = 'Hello';
  }
}

export default angular.module('oekoFlotteApp.main.fleets', [uiRouter])
  .config(routes)
  .component('fleets', {
    template: require('./fleets.html'),
    controller: FleetsComponent,
    controllerAs: 'fleetsCtrl'
  })
  .name;
