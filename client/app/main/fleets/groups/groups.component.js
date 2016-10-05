'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routes from './groups.routes';
import controller from './groups.controller';


export default angular.module('oekoFlotteApp.main.fleets.groups', [uiRouter])
  .config(routes)
  .component('groups', {
    controller,
    template: require('./groups.pug'),
    bindings: {
      settings: '<',
      fleet: '<'
    }
  })
  .name;
