'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.page', {
      url: 'page/:id',
      component: 'page',
      resolve: {
        page: ($http, $translate, $stateParams) => {
          'ngInject';
          // Build path to the file
          const path = ['/api/pages', $stateParams.id, $translate.use()].join('/');
          // Get the file
          return $http.get(path).then( res => res.data.content);
        }
      }
    });
}
