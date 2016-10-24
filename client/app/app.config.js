'use strict';
import uiBootstrap from 'angular-ui-bootstrap';
// Angular modules
import 'angular-bootstrap-colorpicker';
import 'restangular';
import 'angular-bootstrap-confirm';

export default angular.module('oekoFlotteApp.config', [uiBootstrap, 'restangular'])
  .config(function($uibTooltipProvider, RestangularProvider) {
    'ngInject';
    // Configure tooltips and popover
    $uibTooltipProvider.setTriggers({ outsideClick: 'outsideClick' });
    $uibTooltipProvider.options({appendToBody: true});
    // Configure restangular
    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.setRestangularFields({ id: "_id",  selfLink: 'self.link' });
  })
  .name;
