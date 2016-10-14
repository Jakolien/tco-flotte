'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class ChartComponent {
  /*@ngInject*/
  constructor(fleets, appConfig) {
    // Dependancies available in instance
    angular.extend(this, { fleets, appConfig });
    // Create chart object
    this.chart = {
      meta: this.meta,
      groups: this.groups(),
      groupsIds: function() {
        return _.map(this.groups, 'id')
      }
    };
    this.colors = this.colors.bind(this);
    this.columnNames = this.columnNames.bind(this);
    this.columnValues = this.columnValues.bind(this);
    this.tco = this.tco.bind(this);
    this.groups = this.groups.bind(this);
  }
  columnNames() {
    return _.map(this.fleets.all() , k=> k.name || k).join(",");
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
  groups() {
    // Get TCO from the first fleets
    let heading = this.tco()[0];
    let value = heading[this.meta.name];
    // Is the value an object?
    if(value === undefined) {
      return []
    } else if( angular.isObject(value) ) {
      // Returns its keys
      return _.map( _.keys(value), function(name, id) {
        return {
          name,
          id,
          label: name,
          color: '#666',
          values: this.columnValues(name)
        };
      }.bind(this));
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
