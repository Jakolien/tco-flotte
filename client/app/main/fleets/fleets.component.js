'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routes from './fleets.routes';
import controller from './fleets.controller';


export default angular.module('oekoFlotteApp.main.fleets', [uiRouter])
  .config(routes)
  .component('fleets', {
    controller,
    template: require('./fleets.pug'),
    bindings: {
      settings: '<'
    }
  })
  .name;
