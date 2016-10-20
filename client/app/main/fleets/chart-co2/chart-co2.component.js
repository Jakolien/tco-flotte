'use strict';
import angular from 'angular';
import controller from './chart-co2.controller';

export default angular.module('oekoFlotteApp.main.fleets.chart-co2', [])
  .component('chartCo2', {
    controller,
    template: require('./chart-co2.pug'),
    bindings: {
      fleet: '<',
      settings: '<'
    }
  })
  .name;
