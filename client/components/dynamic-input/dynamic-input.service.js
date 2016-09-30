'use strict';
import angular from 'angular';
import _ from 'lodash';

/*@ngInject*/
export function dynamicInputService(DYNAMIC_INPUT) {
  var FIELD_INTERVAL = /(-?\w+)\.\.(-?\w+)/;
  var FIELD_ENUM = /,\w?/g;
  var FIELD_BOOLEAN = /boolean/;

  function bind(fn, me) {
    return function(...args) {
      return Reflect.apply(fn, me, args);
    };
  }

  function DynamicInput(setting, subset) {
    this.getType = bind(this.getType, this);
    this.getValues = bind(this.getValues, this);
    this.setSubset = bind(this.setSubset, this);
    this.setSetting = bind(this.setSetting, this);
    this.setSetting(setting);
    this.setSubset(subset);
  }

  DynamicInput.prototype.setSetting = function(setting) {
    this.setting = setting;
    return this.setting;
  };

  DynamicInput.prototype.setSubset = function(subset = {}) {
    this.subset = subset;
    return this.subset;
  };

  DynamicInput.prototype.getValues = function(subset = this.subset) {
    var EXCEPTION;
    var ceil;
    var floor;
    var i;
    var len;
    var range;
    var ref;
    var ref1;
    var step;

    switch (this.getType()) {
    case DYNAMIC_INPUT.FIELD_INTERVAL:
      step = 1 * this.setting.interval || 1;
      ref = this.setting.values.match(FIELD_INTERVAL);
      [, floor, ceil] = ref;
      floor = isNaN(floor) ? 1 * subset[floor] || 0 : 1 * floor;
      ceil = isNaN(ceil) ? 1 * subset[ceil] || 10 : 1 * ceil;
      return {
        floor,
        ceil,
        step,
        value: this.setting.default || (floor + ceil) / 2,
        range: _.range(floor, ceil + step, step)
      };
    case DYNAMIC_INPUT.FIELD_ENUM:
      range = _.map(this.setting.values.split(','), function(v) {
        return _.trim(v, ' "');
      });
      ref1 = DYNAMIC_INPUT.EXCEPTIONS;
      for(i = 0, len = ref1.length; i < len; i++) {
        EXCEPTION = ref1[i];
        if(EXCEPTION.TO === this.setting.name) {
          if(EXCEPTION.INCLUDE.indexOf(subset[EXCEPTION.IF]) > -1) {
            range = range.concat(EXCEPTION.ADD);
          }
        }
      }
      return { range };
    case DYNAMIC_INPUT.FIELD_BOOLEAN:
      return { range: [true, false] };
    }
  };

  DynamicInput.prototype.getType = function() {
    switch (true) {
    case !this.setting.editable:
      return DYNAMIC_INPUT.FIELD_STATIC;
    case this.setting.hasslider || this.setting.values.match(FIELD_INTERVAL) !== null:
      return DYNAMIC_INPUT.FIELD_INTERVAL;
    case this.setting.values.match(FIELD_ENUM) !== null:
      return DYNAMIC_INPUT.FIELD_ENUM;
    case this.setting.values.match(FIELD_BOOLEAN) !== null:
      return DYNAMIC_INPUT.FIELD_BOOLEAN;
    }
  };

  return DynamicInput;
}


export default angular.module('oekoFlotteApp.dynamic-input', [])
  .service('dynamicInput', dynamicInputService)
  .name;
