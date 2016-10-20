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
          return (fleet || {}).name;
        },
        fleet: function($stateParams, $state, fleets) {
          'ngInject'
          if($stateParams.fleet) {
            return fleets.find($stateParams.fleet);
          } else {
            // Redirect to the fleet
            return fleets.initial().$promise.then(function(fleet) {
              $state.go('main.fleets', { fleet: fleet._id });
            });
          }
        }
      }
    });
}
