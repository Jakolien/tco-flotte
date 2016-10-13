'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('print', {
      url: '/print',
      component: 'print',
      resolve: {
        display: function($http) {
          'ngInject'
          // Get display
          return $http.get('assets/display.json').then( res=> res.data);
        },
        all: function(Restangular, fleets) {
          'ngInject';
          fleets.empty();
          // return fleets.length() ? fleets.initial() : fleets.create().$promise;
          return Restangular.all('fleets').getList().then(function(all) {
            _.each(all, fleets.create);
            return fleets;
          });
        }
      }
    });
}
