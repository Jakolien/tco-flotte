'use strict';
import angular from 'angular';
import controller from './chart.controller';

export default angular.module('oekoFlotteApp.main.visualization.chart', [])
  .component('chart', {
    controller,
    template: require('./chart.pug'),
    bindings: {
      meta: '<',
      static: '<'
    }
  })
  .name;
