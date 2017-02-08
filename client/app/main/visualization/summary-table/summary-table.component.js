'use strict';
import angular from 'angular';

export default angular.module('oekoFlotteApp.main.summary-table', [])
  .component('summaryTable', {
    template: require('./summary-table.pug'),
    bindings: {
      summaries: '<',
      fleets: '<',
      special: '<'
    },
    controller: function() {
      // Filter group to shoow the special one if needed
      this.withSpecial = group => {
        return !group.special || (this.special && group.insights.mileage_special !== 0);
      };
    }
  })
  .name;
