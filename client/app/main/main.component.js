import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';
import controller from './main.controller';


export default angular.module('oekoFlotteApp.main', [uiRouter])
  .config(routing)
  .component('main', {
    controller,
    controllerAs: '$ctrl',
    template: require('./main.pug'),
    bindings: {
      settings: '<'
    }
  })
  .name;
