'use strict';

var DYNAMIC_INPUT = {
  FIELD_INTERVAL: 'interval',
  FIELD_ENUM: 'enum',
  FIELD_BOOLEAN: 'boolean',
  FIELD_COLOR: 'color',
  FIELD_STRING: 'string',
  FIELD_STATIC: 'static',
  EXCEPTIONS: [
    {
      IF: 'energy_type',
      INCLUDE: ['diesel', 'BEV'],
      ADD: ['LNF1', 'LNF2'],
      TO: 'car_type'
    }
  ]
};


export default DYNAMIC_INPUT;
