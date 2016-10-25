'use strict';
import uiBootstrap from 'angular-ui-bootstrap';
// Angular modules
import 'angular-bootstrap-colorpicker';
import 'restangular';
import 'angular-bootstrap-confirm';
import 'angular-growl-v2';

export default angular.module('oekoFlotteApp.config', [uiBootstrap, 'angular-growl', 'restangular'])
  .config(function($uibTooltipProvider, RestangularProvider, growlProvider) {
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
    growlProvider.globalPosition('bottom-right');
    growlProvider.globalDisableCloseButton(true);
  })
  .name;
