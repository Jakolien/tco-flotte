'use strict';

import angular from 'angular';

export default angular.module('oekoFlotteApp.constants', [])
  .constant('appConfig', require('../../server/config/environment/shared'))
  .constant('demoScenario', require('../../server/config/demo'))
  .constant('printMode', /PhantomJS/.test(window.navigator.userAgent))
  .constant('reset', {
    'car_type': ["acquisition_price","battery_size","electricity_consumption",
                 "fixed_costs_car_tax","fixed_costs_check_up","fixed_costs_insurance","fixed_costs_total",
                 "fuel_consumption","leasing_rate","leasing_residual_value","maintenance_costs_inspection",
                 "maintenance_costs_repairs","maintenance_costs_tires","maintenance_costs_total","max_battery_charges","reichweite",
                 "reichweite_NEFZ","residual_value_fixed","residual_value_method","share_electric"],
    'acquisition_year': ["acquisition_price","battery_size","electricity_consumption",
                 "fixed_costs_car_tax","fixed_costs_check_up","fixed_costs_insurance","fixed_costs_total",
                 "fuel_consumption","leasing_rate","leasing_residual_value","maintenance_costs_inspection",
                 "maintenance_costs_repairs","maintenance_costs_tires","maintenance_costs_total","max_battery_charges","reichweite",
                 "reichweite_NEFZ","residual_value_fixed","residual_value_method","share_electric"],
    'car_type': ["acquisition_price","battery_size","electricity_consumption",
                 "fixed_costs_car_tax","fixed_costs_check_up","fixed_costs_insurance","fixed_costs_total",
                 "fuel_consumption","leasing_rate","leasing_residual_value","maintenance_costs_inspection",
                 "maintenance_costs_repairs","maintenance_costs_tires","maintenance_costs_total","max_battery_charges","reichweite",
                 "reichweite_NEFZ","residual_value_fixed","residual_value_method","share_electric"],
    'charging_option':['charging_option_unitary_cost', 'charging_option_maintenance_costs'],
    'charging_option2':['charging_option2_unitary_cost', 'charging_option2_maintenance_costs']
  })
  .constant('valueOrders', {
    energy_type: ['benzin', 'diesel', 'hybrid-benzin', 'hybrid-diesel', 'BEV',
                  'long_distance_train', 'short_distance_train', 'rental_bev',
                  'rental_gas', 'bike', 'plane', 'businessplane', 'savings']
  })
  .name;
