'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor(fleets) {
    angular.extend(this, { fleets });
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true });
    // Basic information and summaries
    this.summaries = _.filter(this.settings, { report: 'Summary' });
    this.basics = _.filter(this.settings, { report: 'Basic information for the calculation' });
    console.log(fleets.get(0));
  }
}
