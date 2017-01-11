'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.page', {
      url: 'page/:id',
      component: 'page'
    });
}
