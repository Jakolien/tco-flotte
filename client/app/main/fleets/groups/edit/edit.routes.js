'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.fleets.groups.edit', {
      url: '/:group/edit',
      component: 'edit',
      resolve: {
        group: function($stateParams, fleet) {
          'ngInject'
          return fleet.groups.get($stateParams.group);
        }
      }
    });
}
