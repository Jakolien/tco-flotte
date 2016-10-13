'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('print', {
      url: '/print?fleets',
      params: {
        fleets: {
          array: true
        }
      },
      template: '<print></print>',
      resolve: {
        all: function(Restangular, fleets) {
          'ngInject';
          // return fleets.length() ? fleets.initial() : fleets.create().$promise;
          return Restangular.all('fleets').getList().then(function(all) {
            _.each(all, fleets.create);
            return fleets;
          });
        }
      }
    });
}
