import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';
import controller from './main.controller';


export default angular.module('oekoFlotteApp.main', [uiRouter])
  .config(routing)
  .component('main', {
    template: require('./main.html'),
    controller: controller,
    controllerAs: 'main'
  })
  .name;
