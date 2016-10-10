'use strict';

export function routeConfig($urlRouterProvider, $locationProvider, $uibTooltipProvider, RestangularProvider) {
  'ngInject';
  // Configure ui-router
  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(false);
  // Configure tooltips and popover
  $uibTooltipProvider.setTriggers({ outsideClick: 'outsideClick' });
  $uibTooltipProvider.options({appendToBody: true});
  // Configure restangular
  RestangularProvider.setBaseUrl('/api');
  RestangularProvider.setRestangularFields({ id: "_id",  selfLink: 'self.link' });
}
