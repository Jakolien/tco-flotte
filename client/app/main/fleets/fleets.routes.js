'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.fleets', {
      url: 'fleets',
      component: 'fleets'
    });
}
