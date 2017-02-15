'use strict';

import angular from 'angular';

export default angular.module('oekoFlotteApp.sticky', [])
  .directive('sticky', function($window) {
    'ngInject';
    return {
      restrict: 'AC',
      link: function(scope, el) {
        Stickyfill.add(el[0]);
        angular.element(el).addClass('sticky');
      }
    }
  }).name;
