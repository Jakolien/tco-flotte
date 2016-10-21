'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('print', {
      url: '/print?{clip:bool}&{ids:string}',
      component: 'print',
      params: {
        clip: null
      },
      resolve: {
        display: function($http) {
          'ngInject'
          // Get display
          return $http.get('assets/display.json').then( res=> res.data);
        },
        all: function(Restangular, fleets, $stateParams) {
          'ngInject';
          // Empty the fleet array
          fleets.empty();
          // Get the fleets before rendering
          return Restangular.all('fleets').getList({ ids: $stateParams.ids }).then(function(all) {
            // Add every new fleet
            fleets.push(...all);
            // And return the object
            return fleets;
          });
        }
      }
    });
}
