'use strict';
import uiBootstrap from 'angular-ui-bootstrap';
// Angular modules
import 'angular-bootstrap-colorpicker';
import 'restangular';
import 'angular-bootstrap-confirm';
import 'angular-growl-v2';
import 'angular-loading-bar';

export default angular.module('oekoFlotteApp.config', [uiBootstrap, 'angular-growl', 'restangular', 'angular-loading-bar'])
  .config(function($uibTooltipProvider, RestangularProvider, growlProvider, cfpLoadingBarProvider) {
    'ngInject';
    // Configure tooltips and popover
    $uibTooltipProvider.setTriggers({ outsideClick: 'outsideClick' });
    $uibTooltipProvider.options({appendToBody: true});
    // Configure restangular
    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.setRestangularFields({ id: "_id",  selfLink: 'self.link' });
    // Configure growl
    growlProvider.globalDisableCountDown(true);
    growlProvider.globalTimeToLive(5000);
    growlProvider.globalPosition('top-right');
    growlProvider.globalDisableCloseButton(true);
    growlProvider.onlyUniqueMessages(false);
    // Progress bar
    cfpLoadingBarProvider.includeSpinner = false;
  })
  .config(function($httpProvider, $injector) {
    'ngInject';
    // Add interceptor to change the accept language header
    $httpProvider.interceptors.push(function() {
      'ngInject';
      // Use injector to get $translate instance in order to avoid circular deps
      let $translate = $injector.get('$translateProvider');
      return {
       request: function(config) {
          // Change the headers
          config.headers['accept-language'] = $translate.use() || 'en'
          // Return the new config to apply it
          return config;
        }
      };
    })
  })
  .run(function($rootScope, printMode) {
    'ngInject';
    // Detect headless browser
    if (printMode){
      // Specipy a fixed width for the charts
      $rootScope.chartWidth = 720;
    }
  })
  .name;
