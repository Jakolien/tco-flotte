'use strict';
import _ from 'lodash';
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
    this.groupBy = this.groupBy.bind(this);

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
  groupBy(energytype) {
    return _.find(this.fleet.groups.all(), g=> g.vars.energy_type === energytype);
  }
}
