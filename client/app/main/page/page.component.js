import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './page.routes';
import controller from './page.controller';


export default angular.module('oekoFlotteApp.main.page', [uiRouter])
  .config(routing)
  .component('page', {
    controller,
    controllerAs: '$ctrl',
    template: require('./page.pug')
  })
  .name;
