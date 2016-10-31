'use strict';
import angular from 'angular';
import _ from 'lodash';

/*@ngInject*/
export function trimFilter() {
  return function(input) {
    return _.trim(input);
  };
}


export default angular.module('oekoFlotteApp.trim', [])
  .filter('trim', trimFilter)
  .name;
