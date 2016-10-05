'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.fleets.groups', {
      component: 'groups'
    });
}
