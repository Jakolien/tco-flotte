'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor(fleets, appConfig) {
    // Dependancies available in instance
    angular.extend(this, { fleets, appConfig });
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true});
    // Create chart object
    this.charts = _.map(this.display, function(meta, id) {
      return {
        meta,
        groups: this.groups(meta),
        groupsIds: function() {
          return _.map(this.groups, 'id')
        }
      }
    }.bind(this));
    this.colors = this.colors.bind(this);
  }
  columnNames(subset){
    return _.map(subset, k=> k.name || k).join(",");
  }
  colors(chart) {
    return function(color, d) {
      // Find the color id
      let id = (d.id || d) * 1 % this.appConfig.colors.length;
      // Get the id from the color array
      return this.appConfig.colors[id];

    }.bind(this);
  }
  columnValues(groupName, meta){
    return this.tco().map(function(value) {
      if(!value[meta.name]) {
        return 0;
      } else if(groupName === '^') {
        return value[meta.name];
      } else {
        return value[meta.name][groupName];
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
      return _.map( _.keys(value), function(name, id) {
        return {
          name,
          id,
          label: name,
          color: '#666',
          values: this.columnValues(name, meta)
        };
      }.bind(this));
    } else {
      return [
        {
          id: 0,
          name: '^',
          label: meta.name,
          color: '#666',
          values: this.columnValues('^', meta)
        }
      ];
    }
  }
}
