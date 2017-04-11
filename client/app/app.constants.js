'use strict';

import angular from 'angular';

export default angular.module('oekoFlotteApp.constants', [])
  .constant('appConfig', require('../../server/config/environment/shared'))
  .constant('demoScenario', require('../../server/config/demo'))
  .constant('printMode', /PhantomJS/.test(window.navigator.userAgent))
  .constant('reset', {
    'car_type': ['fuel_consumption']
  })
  .constant('valueOrders', {
    energy_type: ['benzin', 'diesel', 'hybrid-benzin', 'hybrid-diesel', 'BEV',
                  'long_distance_train', 'short_distance_train', 'rental_bev',
                  'rental_gas', 'bike', 'plane', 'businessplane', 'savings']
  })
  .name;
