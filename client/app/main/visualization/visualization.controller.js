'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor(fleets) {
    // Dependancies available in instance
    angular.extend(this, { fleets });
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true});
    // Create chart object
    this.charts = _.map(this.display, function(meta) {
      return {
        meta,
        groups: this.groups(meta)
      }
    }.bind(this));
    console.log(this.charts, fleets.get(0));
  }
  columnNames(group, meta){
    return _.map(this.fleets.all(), 'name').join(",");
  }
  columnColors(group, meta){
    return 'silver';
  }
  columnValues(group, meta){
    return this.tco().map(function(value) {
      if(!value[meta.name]) {
        return 0
      } else if(group === '^') {
        return value[meta.name];
      } else {
        return value[meta.name][group];
      }
    }).join(",");
  }
  tco() {
    return _.map(this.fleets.all(), 'TCO');
  }
  groups(meta) {
    // Get TCO from the first fleets
    let heading = this.tco()[0];
    let value = heading[meta.name];
    // Is the value an object?
    if(value === undefined) {
      return []
    } else if( angular.isObject(value) ) {
      // Returns its keys
      return _.map( _.keys(value), function(name) {
        return name
      });
    } else {
      return ['^'];
    }
  }
}
