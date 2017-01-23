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
      mine: function(fleets, Restangular, Auth, $q) {
        'ngInject'
        // Init and get user session
        return Auth.getCurrentUser().then(function(user) {
          // Get all keys stored locally
          return $q(resolve => fleets.store.all(resolve)).then(function(all) {
            if (!Auth.isLoggedInSync()) {
              // Remove expired record
              all = all.filter(r => !r.expire || r.expire >= Date.now());
            }
            // Collect keys
            const keys = _.map(all, 'key');
            // Get all fleets for this user or the stored keys
            let mine = Restangular.all('fleets').getList({ids: keys.join(',')});
            // Return the promise
            return mine.then(function(all) {
              // Add every new fleet
              fleets.push(...all);
              // And return the instance
              return fleets;
            });
          });
        });
      }
    }
  });
}
