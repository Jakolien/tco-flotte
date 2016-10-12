'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routes from './visualization.routes';
import controller from './visualization.controller';

export default angular.module('oekoFlotteApp.main.visualization', [uiRouter])
  .config(routes)
  .component('visualization', {
    controller,
    template: require('./visualization.pug'),
    bindings: {
      display: '<'
    }
  })
  .name;
