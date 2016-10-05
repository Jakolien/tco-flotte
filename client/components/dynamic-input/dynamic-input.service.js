'use strict';
import _ from 'lodash';

/*@ngInject*/
export default function DynamicInputService(DYNAMIC_INPUT, $translate) {
  var FIELD_INTERVAL = /(-?\w+)\.\.(-?\w+)/;
  var FIELD_ENUM = /,\w?/g;
  var FIELD_BOOLEAN = /boolean/;

  function bind(fn, me) {
    return function(...args) {
      return Reflect.apply(fn, me, args);
    };
  }

  class DynamicInput {

    constructor(meta, subset = {}) {
      // Methods binded to that class' instance
      this.getType = this.getType.bind(this);
      this.getValues = this.getValues.bind(this);
      this.setSubset = this.setSubset.bind(this);
      this.setMeta = this.setMeta.bind(this);
      this.translate = this.translate.bind(this);
      // Set meta and subset
      this.setMeta(meta);
      this.setSubset(subset);
    }

    setMeta(meta) {
      this.meta = meta;
      return this.meta;
    }

    setSubset(subset = {}) {
      this.subset = subset;
      return this.subset;
    }

    getValues(subset = this.subset) {
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
        step = 1 * this.meta.interval || 1;
        ref = this.meta.values.match(FIELD_INTERVAL);
        [, floor, ceil] = ref;
        floor = isNaN(floor) ? 1 * subset[floor] || 0 : 1 * floor;
        ceil = isNaN(ceil) ? 1 * subset[ceil] || 10 : 1 * ceil;
        return {
          floor,
          ceil,
          step,
          value: this.meta.default || (floor + ceil) / 2,
          range: _.range(floor, ceil + step, step),
          translate: this.translate
        };
      case DYNAMIC_INPUT.FIELD_ENUM:
        range = _.map(this.meta.values.split(','), function(v) {
          return _.trim(v, ' "');
        });
        ref1 = DYNAMIC_INPUT.EXCEPTIONS;
        for(i = 0, len = ref1.length; i < len; i++) {
          EXCEPTION = ref1[i];
          if(EXCEPTION.TO === this.meta.name) {
            if(EXCEPTION.INCLUDE.indexOf(subset[EXCEPTION.IF]) > -1) {
              range = range.concat(EXCEPTION.ADD);
            }
          }
        }
        return { range, translate: this.translate };
      case DYNAMIC_INPUT.FIELD_BOOLEAN:
        return { range: [true, false], translate: this.translate };
      }
    }

    translate(value) {
      if( this.meta.unit === undefined || this.meta.unit === null ) {
        return value;
      } else {
        return value + ' ' + $translate.instant(this.meta.unit);
      }
    }

    getType() {
      switch (true) {
      case !this.meta.editable:
        return DYNAMIC_INPUT.FIELD_STATIC;
      case this.meta.hasslider || this.meta.values.match(FIELD_INTERVAL) !== null:
        return DYNAMIC_INPUT.FIELD_INTERVAL;
      case this.meta.values.match(FIELD_ENUM) !== null:
        return DYNAMIC_INPUT.FIELD_ENUM;
      case this.meta.values.match(FIELD_BOOLEAN) !== null:
        return DYNAMIC_INPUT.FIELD_BOOLEAN;
      }
    }

  }

  return DynamicInput;
}
