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
    growlProvider.globalTimeToLive(7000);
    growlProvider.globalPosition('top-right');
    growlProvider.globalDisableCloseButton(true);
    // Progress bar
    cfpLoadingBarProvider.includeSpinner = false;
  })
  .name;
