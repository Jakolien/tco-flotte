'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import controller from './edit.controller';

import routes from './edit.routes';


export default angular.module('oekoFlotteApp.main.fleets.groups.edit', [uiRouter])
  .config(routes)
  .component('edit', {
    controller,
    template: require('./edit.pug'),
    bindings: {
      settings: '<',
      fleet: '<',
      group: '<'
    }
  })
  .name;
