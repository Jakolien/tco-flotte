'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

const LEASING_INCLUDES = [
  'leasing_includes_insurance',
  'leasing_includes_tax',
  'leasing_includes_service'
];

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
    this.values       = this.values.bind(this);
    // Number of times the chart have been rendered
    this.rendered = 0;
    // Save the max value
    this.max = _.sum(this.groups().map( g=> 1*g.values));
  }
  get unit() {
    return this.$translate.instant(this.meta.unit) || '';
  }
  get leasingAlert() {
    return this.meta.leasingconditions && this.someLeasingIncluded;
  }
  get someLeasingIncluded() {
    return _.some(this.fleets.all(), this.leasingIncluded);
  }
  leasingIncluded(fleet) {
    // Enter groups attribute
    return _.chain(fleet.groups.all())
      // Enter vars attribute
      .map('vars')
      // Pick leasing values as an array
      .map(vars => _.chain(vars).pick(LEASING_INCLUDES).values().value() )
      // Does any value in this array is true?
      .map(includes => _.some(includes))
      // Does any fleet has a leasing option to true?
      .some()
      // Return the final boolean
      .value();
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
    return this.fleets.all().map(g=> g.name).join(",");
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
    return this.meta.type === 'stacked_bar';
  }
  values() {
    let values = [];
    // Is the value an object?
    if( this.hasGroups() ) {
      this.tco().forEach(tco =>{
        _.forEach(tco[this.meta.name], function(value, key) {
          if(value) {
            values.push(key);
          }
        });
      });
    } else {
      this.tco().forEach(tco => {
        if( tco[this.meta.name] ) {
          values.push( tco[this.meta.name] )
        }
      });
    }
    return _.uniq(values);
  }
  groups() {
    // Get TCO from the first fleets
    let values = this.values();
    // Is the value an object?
    if( this.hasGroups() ) {
      // Returns its keys
      return _.map(values, function(name, id) {
        // Add a asterix symbol to "net_acquisition_cost" if some fleets have
        // leasing options included.
        let suffix = name === 'net_acquisition_cost' && this.someLeasingIncluded ? '*' : '';
        return {
          name,
          id,
          label: this.$translate.instant(name) + suffix,
          color: '#666',
          values: this.columnValues(name)
        };
      }.bind(this));
    } else {
      if(values.length = 0) {
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
}
