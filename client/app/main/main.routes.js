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
        return Restangular.all('fleets').getList().then(function(all) {
          return _.map(all, fleets.create);
          //return _.map(all, angular.noop);
        });
      }
    }
  });
}
