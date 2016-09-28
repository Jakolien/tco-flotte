'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.visualization', {
      url: 'visualization',
      template: '<visualization></visualization>'
    });
}
