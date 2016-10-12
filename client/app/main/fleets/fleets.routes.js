'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.fleets', {
      url: 'fleets/:fleet',
      component: 'fleets',
      params: {
        fleet: {
          value: null
        }
      },
      resolve: {
        $title: function(fleet) {
          'ngInject'
          return fleet.name;
        },
        fleet: function($stateParams, fleets) {
          'ngInject'
          return $stateParams.fleet ? fleets.get($stateParams.fleet) : fleets.initial();
        }
      }
    });
}
