'use strict';
import angular from 'angular';
import controller from './chart-grouped.controller';

export default angular.module('oekoFlotteApp.main.visualization.chart-grouped', [])
  .component('chartGrouped', {
    controller,
    template: require('./chart-grouped.pug'),
    bindings: {
      meta: '<'
    }
  })
  .name;
