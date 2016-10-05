'use strict';

import angular from 'angular';
import fleetsService from './fleets.service';


export default angular.module('oekoFlotteApp.fleets', [])
  .service('fleets', fleetsService)
  .name;
