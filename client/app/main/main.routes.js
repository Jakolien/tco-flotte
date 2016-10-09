'use strict';

export default function routes($stateProvider) {
  'ngInject';

  $stateProvider.state('main', {
    url: '/',
    component: 'main',
    resolve: {
      settings: function($http) {
        'ngInject'
        // Get settings
        return $http.get('assets/settings.json').then( function(res) {
          return _.sortBy(res.data, 'importancerank');
        });
      },
      all: function(fleets, Restangular) {
        'ngInject'
        // return fleets.length() ? fleets.initial() : fleets.create().$promise;
        return fleets.length() ? fleets : Restangular.all('fleets').getList().then(function(all) {
          _.each(all, fleets.create);
          return fleets;
        });
      }
    }
  });
}
