'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.fleets', {
      url: 'fleets',
      component: 'fleets',
      params: {
        fleet: {
          value: null
        }
      },
      resolve: {
        fleet: function($stateParams, fleets) {
          'ngInject'
          return $stateParams.fleet ? fleets.get($stateParams.fleet) : fleets.initial();
        }
      }
    });
}
