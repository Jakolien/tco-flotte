'use strict';

import angular from 'angular';
import DynamicInputService from './dynamic-input.service';
import DYNAMIC_INPUT from './dynamic-input.constant';

export default angular.module('oekoFlotteApp.dynamic-input', [])
  .constant('DYNAMIC_INPUT', DYNAMIC_INPUT)
  .service('DynamicInput', DynamicInputService)
  .name;
