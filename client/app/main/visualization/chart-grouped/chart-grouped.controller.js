'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class ChartGroupedComponent {
  /*@ngInject*/
  constructor(fleets, $translate) {
    class FleetChart {
      constructor(fleet, meta) {
        angular.extend(this, { fleet, meta });
        // Number of times the charts have been rendered
        this.rendered = 0;
      }
      get groups() {
        return this.fleet.groups.all();
      }
      get columns() {
        return this.groups.map( (g)=>{
          if(g.special) {
            return $translate.instant(g.name);
          } else {
            return g.name;
          }
        });
      }
      get columnsStr() {
        return this.columns.join(',');
      }
      get id() {
        return `${this.fleet._id}-${this.meta.name}`;
      }
      get values() {
        return this.groups.map( function(group) {
          return this.fleet.TCO[this.meta.name][group.name]
        }.bind(this));
      }
      get valuesStr() {
        return this.values.join(',');
      }
      get colors() {
        return this.groups.map(g => g.vars.group_color);
      }
      get colorsFn() {
        return (color, value)=> this.colors[value.index];
      }
    }
    // Created a FleetChart instance for each fleets
    this.fleetCharts = fleets.all().map( f=> new FleetChart(f, this.meta) );
  }
}
