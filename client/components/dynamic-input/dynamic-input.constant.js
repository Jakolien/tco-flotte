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
      IF: 'car_type',
      INCLUDE: ['klein'],
      SET: ['benzin', 'diesel', 'BEV'],
      TO: 'energy_type'
    },
    {
      IF: 'car_type',
      INCLUDE: ['mittel'],
      SET: ['benzin', 'diesel', 'BEV', 'hybrid-benzin'],
      TO: 'energy_type'
    },
    {
      IF: 'car_type',
      INCLUDE: ['groß'],
      SET: ['benzin', 'diesel', 'BEV', 'hybrid-benzin', 'hybrid-diesel'],
      TO: 'energy_type'
    },
    {
      IF: 'car_type',
      INCLUDE: ['LNF1', 'LNF2'],
      SET: ['diesel', 'BEV'],
      TO: 'energy_type'
    }
  ]
};


export default DYNAMIC_INPUT;
