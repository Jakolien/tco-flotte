'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.visualization', {
      url: 'visualization?{ids:string}',
      component: 'visualization',
      params: {
        ids: null
      },
      resolve: {
        $title: function($translate) {
          'ngInject';
          return $translate.instant('visualize_title');
        },
        ids: function(Restangular, fleets, $stateParams) {
          'ngInject';
          // Reset the fleet list according to the given ids array
          if($stateParams.ids) {
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
      }
    });
}
