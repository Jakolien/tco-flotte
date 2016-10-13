'use strict';
import angular    from 'angular';
import uiRouter   from 'angular-ui-router';
import routes     from './print.routes';
import controller from './print.controller';


export default angular.module('oekoFlotteApp.print', [uiRouter])
  .config(routes)
  .component('print', {
    controller,
    template: require('./print.pug')
  })
  .name;
