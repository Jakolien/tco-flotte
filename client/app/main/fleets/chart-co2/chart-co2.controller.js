'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

export default class ChartCo2Component {
  /*@ngInject*/
  constructor(fleets, $translate, $filter) {
    // Dependancies available in instance
    angular.extend(this, { fleets, $translate, $filter });
    // Filter settings to only keep the one visualized in this chart
    this.settings = _.filter(this.settings, { co2chart: true });
    // Initialize rendering count
    this.rendered = 0;
    // Bind to instance
    this.groupBy   = this.groupBy.bind(this);
    this.bindChart = this.bindChart.bind(this);
    this.addUnitTo = this.addUnitTo.bind(this);

  }
  get columns() {
    return this.settings.map(s => this.$translate.instant(s.energytype));
  }
  get columnsStr() {
    return this.columns.join(',');
  }
  get id() {
    return 'fleet-co2';
  }
  get values() {
    return this.settings.map( function(meta) {
      return this.fleet.fleet_presets[meta.name]
    }.bind(this));
  }
  get valuesStr() {
    return this.values.join(',');
  }
  get colorsFn() {
    return function(color, d) {
      if(!isNaN(d.index)) {
        let group = this.groupBy(this.settings[d.index].energytype);
        if(group) {
          return group.vars.group_color;
        }
      }
      return color;
    }.bind(this);
  }
  get unit() {
    return this.$translate.instant('g');
  }
  bindChart(chart) {
    this.addUnitTo(chart);
  }
  addUnitTo(chart) {
    // Remove y axis clipping
    $('.c3-axis-y', chart.element).attr('clip-path', null);
    // Find last tick element
    let last = $('.c3-axis-y g.tick:last', chart.element);
    // Build a unit element
    let unit = `<text style="text-anchor: start" y="3" x="-4">${this.unit}</text>`;
    // Add the
    last.html( last.html() + unit);
  }
  groupBy(energytype) {
    return _.find(this.fleet.groups.all(), g=> g.vars.energy_type === energytype);
  }
}
