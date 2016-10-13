'use strict';

export default function routes($stateProvider) {
  'ngInject';

  $stateProvider.state('main', {
    url: '/?language',
    component: 'main',
    params: {
      language: {
        value: null
      }
    },
    resolve: {
      language: function($translate, $stateParams) {
        'ngInject'
        return $translate.onReady().then(function() {
          if($stateParams.language !== null) {
            $translate.use($stateParams.language);
          }
        });
      },
      settings: function($http) {
        'ngInject'
        // Get settings
        return $http.get('assets/settings.json').then( function(res) {
          return _.sortBy(res.data, 'importancerank');
        });
      },
      display: function($http) {
        'ngInject'
        // Get display
        return $http.get('assets/display.json').then( res=> res.data);
      },
      all: function(fleets, Restangular) {
        'ngInject'
        // return fleets.length() ? fleets.initial() : fleets.create().$promise;
        return Restangular.all('fleets').getList().then(function(all) {
          _.each(all, fleets.create);
          return fleets;
        });
      }
    }
  });
}
