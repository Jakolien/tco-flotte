'use strict';

export function routeConfig($urlRouterProvider, $locationProvider, $uibTooltipProvider, ) {
  'ngInject';
  // Configure ui-router
  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(false);
  // Configure tooltips and popover
  $uibTooltipProvider.setTriggers({ outsideClick: 'outsideClick' })
  $uibTooltipProvider.options({appendToBody: true})
  // Configure restangular
}
