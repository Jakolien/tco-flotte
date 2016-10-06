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
        return $http.get('assets/settings.json').then( (res)=> res.data )
      },
      all: function(fleets, Restangular) {
        'ngInject'
        return fleets.length() ? fleets : Restangular.all('fleets').getList().then(function(all) {
          _.each(all, fleets.create);
          return fleets;
        });
      }
    }
  });
}
