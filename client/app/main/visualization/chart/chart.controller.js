'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

export default class ChartComponent {
  /*@ngInject*/
  constructor(fleets, appConfig, $translate, $filter) {
    // Dependancies available in instance
    angular.extend(this, { fleets, appConfig, $translate, $filter });
    // Create chart object
    this.chart = {
      meta: this.meta,
      groups: this.groups(),
      groupsIds: function() {
        return _.map(this.groups, 'id')
      }
    };
    // Bind to instance
    this.colors       = this.colors.bind(this);
    this.columnNames  = this.columnNames.bind(this);
    this.columnValues = this.columnValues.bind(this);
    this.tco          = this.tco.bind(this);
    this.groups       = this.groups.bind(this);
    this.bindChart    = this.bindChart.bind(this);
    this.addUnitTo    = this.addUnitTo.bind(this);
    // Number of times the chart have been rendered
    this.rendered = 0;
    // Save the max value
    this.max = _.sum(this.groups().map( g=> 1*g.values));
  }
  get unit() {
    return this.$translate.instant(this.meta.unit) || '';
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
  columnNames() {
    return this.fleets.all().map( g=> this.$translate.instant(g.name || g)).join(",");
  }
  colors() {
    return function(color, d) {
      // Find the color id
      let id = (d.id || d) * 1 % this.appConfig.colors.length;
      // Get the id from the color array
      return this.appConfig.colors[id];
    }.bind(this);
  }
  columnValues(groupName){
    return this.tco().map(function(value) {
      if(!value[this.meta.name]) {
        return 0;
      } else if(groupName === '^') {
        return value[this.meta.name];
      } else {
        return value[this.meta.name][groupName];
      }
    }.bind(this)).join(",");
  }
  tco() {
    return _.map(this.fleets.all(), 'TCO');
  }
  hasGroups() {
    let value = this.tco()[0][this.meta.name];
    return angular.isObject(value);
  }
  groups() {
    // Get TCO from the first fleets
    let heading = this.tco()[0];
    let value = heading[this.meta.name];
    // Is the value an object?
    if( this.hasGroups() ) {
      // Returns its keys
      return _.map( _.keys(value), function(name, id) {
        return {
          name,
          id,
          label: this.$translate.instant(name),
          color: '#666',
          values: this.columnValues(name)
        };
      }.bind(this));
    } else if(value === undefined) {
      return [];
    } else {
      return [
        {
          id: 0,
          name: '^',
          label: this.meta.name,
          color: '#666',
          values: this.columnValues('^')
        }
      ];
    }
  }
}
