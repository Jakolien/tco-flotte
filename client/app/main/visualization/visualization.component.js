'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routes from './visualization.routes';

export class VisualizationComponent {
  /*@ngInject*/
  constructor() {
    this.message = 'Hello';
  }
}

export default angular.module('oekoFlotteApp.main.visualization', [uiRouter])
  .config(routes)
  .component('visualization', {
    template: require('./visualization.html'),
    controller: VisualizationComponent,
    controllerAs: 'visualizationCtrl'
  })
  .name;
