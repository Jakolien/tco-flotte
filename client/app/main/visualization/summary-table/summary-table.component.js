'use strict';
import angular from 'angular';

export default angular.module('oekoFlotteApp.main.summary-table', [])
  .component('summaryTable', {
    template: require('./summary-table.pug'),
    bindings: {
      summaries: '<',
      fleets: '<'
    }
  })
  .name;
