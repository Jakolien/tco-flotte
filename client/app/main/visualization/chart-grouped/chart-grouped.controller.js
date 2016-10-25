'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

export default class ChartGroupedComponent {
  /*@ngInject*/
  constructor(fleets, $translate, $filter) {
    class FleetChart {
      constructor(fleet, meta) {
        angular.extend(this, { fleet, meta });
        // Number of times the charts have been rendered
        this.rendered = 0;
        this.bindChart = this.bindChart.bind(this);
        this.addUnitTo = this.addUnitTo.bind(this);
      }
      bindChart(chart) {
        this.addUnitTo(chart)
      }
      addUnitTo(chart) {
        // Remove y axis clipping
        $('.c3-axis-y', chart.element).attr('clip-path', null);
        // Find last tick element
        let last = $('.c3-axis-y g.tick:last', chart.element);
        // Build a unit element
        let unit = `<text style="text-anchor: start" y="3" x="-2">${this.unit}</text>`;
        // Add the
        last.html( last.html() + unit);
      }
      get unit() {
        return $translate.instant(this.meta.unit) || '';
      }
      get groups() {
        return _.filter(this.fleet.groups.all(), (group) =>{
          return this.fleet.TCO[this.meta.name][group.name] > 0;
        });
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
    // Filters avalaible within scope
    angular.extend(this, { $filter });
  }
}
