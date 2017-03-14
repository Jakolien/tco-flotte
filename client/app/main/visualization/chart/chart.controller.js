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
  constructor(fleets, appConfig, printMode, $translate, $filter, $log, $element) {
    $log.log('Rendering %s with %s fleet(s)', this.meta.name, fleets.length());
    // Dependancies available in instance
    angular.extend(this, { fleets, appConfig, $translate, $filter, $element, printMode });
    // Bind to instance
    this.tco          = this.tco.bind(this);
    this.bindChart    = this.bindChart.bind(this);
    this.addUnitTo    = this.addUnitTo.bind(this);
    this.colors       = this.colors.bind(this);
    this.yFormat      = this.yFormat.bind(this);
    // Memoize some heavy methods
    this.columnNames  = _.memoize(this.columnNames.bind(this));
    this.columnValues = _.memoize(this.columnValues.bind(this));
    this.groups       = _.memoize(this.groups.bind(this));
    this.values       = _.memoize(this.values.bind(this));
    this.yValues      = _.memoize(this.yValues.bind(this));
    // Create chart object
    this.chart = {
      meta: this.meta,
      groups: this.groups(),
      groupsIds: function() {
        return _.map(this.groups, 'id')
      },
      groupsNames: function() {
        return _.map(this.groups, 'name')
      }
    };
    // Number of times the chart have been rendered
    this.rendered = 0;
    // Save the max value
    this.max = _.sum(this.groups().map( g =>{
      return _.max(_.map(g.values.split(','), Number));
    }));
  }
  get barWidth() {
    const chartWidth = $(this.$element).width();
    const maxWidth = chartWidth / this.chart.groups.length;
    return Math.min(maxWidth * 0.8, chartWidth * 0.2);
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
  get hasFrozenGroupsOrder() {
    return !!_.intersection(this.chart.groupsNames(), this.appConfig.frozenGroups).length;
  }
  get sortDataBy() {
    return this.hasFrozenGroupsOrder ? 'null' : 'asc';
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
    if (!this.printMode) {
      this.addUnitTo(chart);
    }
  }
  addUnitTo(chart) {
    // Remove y axis clipping
    $('.c3-axis-y', chart.element).attr('clip-path', null);
    // Find last tick element
    let last = $('.c3-axis-y g.tick:last', chart.element);
    // Build a unit element
    let unit = `<text style="text-anchor: start" y="3" x="-4">${this.unit}</text>`;
    // Add the
    last.html(last.html() + unit);
  }
  yFormat(value) {
    value = this.$filter('number')(value);
    if (this.printMode) {
      return `${value} ${this.unit}`;
    }
    return value;
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
  yValues() {
    const ticks = 7;
    // Calculate the slice size
    const slice = Math.ceil(this.max/(ticks - 1));
    // Create at least 7 slices
    const values =  _.reduce(Array(ticks), (res, v, i) => {
      if(i * slice <= this.max + slice) {
        res.push(i * slice);
      }
      return res;
    }, []);
    // Add a tick if the last slice is not high enough
    if( this.max/_.last(values) > 0.9 ) {
      values.push(values.length * slice);
    }
    return values;
  }
  yMax() {
    return _.last(this.yValues());
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
    return _.chain(values)
      .uniq()
      // Sort by a frozen order
      .sortBy( name => {
        return this.appConfig.frozenGroups.indexOf(name);
      }).value();
  }
  groups() {
    // Get TCO from the first fleets
    let values = this.values();
    // Is the value an object?
    if( this.hasGroups() ) {
      // Returns its keys
      return _.chain(values).map((name, id)=> {
        // Add a asterix symbol to "net_acquisition_cost" if some fleets have
        // leasing options included.
        let suffix = name === 'net_acquisition_cost' && this.someLeasingIncluded ? '*' : '';
        // Rreturn an obbject description this group
        return {
          name,
          id,
          label: this.$translate.instant(name) + suffix,
          color: '#666',
          values: this.columnValues(name)
        };
      // Order the groups according to a fixed order
      }).sortBy(group => {
        const frozen = this.appConfig.frozenGroups.indexOf(group.name);
        if(frozen === -1) {
          // Use the first value
          return Number(_.first(group.values.split(',')));
        }
        return frozen;
      }).value();
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
