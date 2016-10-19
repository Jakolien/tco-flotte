'use strict';

import mongoose    from 'mongoose';
import _           from 'lodash';
// Process fleet object
import FleetProcessor    from '../../../processor/fleet.js'
// Those energy types must be present in at least one group by fleet
import {SG_ENERGY_TYPES} from '../../../processor/fleet.js'

var GroupSchema = new mongoose.Schema({
  name: String,
  vars: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  minimize: false,
  skipVersioning: true,
  toObject: {
    virtuals: true
  }
});

GroupSchema.virtual('special').get(function () {
  return SG_ENERGY_TYPES.indexOf(this.vars.energy_type) > -1;
});

var FleetSchema = new mongoose.Schema({
  name: String,
  active: Boolean,
  vars: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  groups: {
    type: [GroupSchema],
    default: []
  },
  self: {}
}, {
  minimize: false,
  timestamps: true,
  versionKey: 'revision'
})

FleetSchema.virtual('self.link').get(function () {
  return `/api/fleets/${this._id}`
});

// Add special groups
FleetSchema.pre('validate', function (next) {
  // Groups must be exists
  this.groups = this.groups || [];
  // Those 7 energy_types must exist in a group
  for(let type of SG_ENERGY_TYPES) {
    // Retrocompatibility with lodash -_-
    let some = _.someBy || _.some;
    // No group contains this energy type!
    if(!some(this.groups, g=> (g.vars || {}).energy_type === type)) {
      // Create the group!
      this.groups.push({
        name: type,
        vars: {
          energy_type: type,
          num_of_vehicles: 1,
          mileage: 0
        }
      })
    }
  }
  next();
});

// The fleet must be used by the FleetProcessor
FleetSchema.pre('validate', function (next) {
  try {
    // We try to create an instance of fleet processor
    new FleetProcessor(this);
    // Everything is ok, just continue
    next();
  } catch (e) {
    // If the instanciation raise an error, we must propage it
    next(Error('The given Fleet object is not valid: ' + e.message));
  }
});

// Create colors
FleetSchema.pre('validate', function (next) {
  let colors = require('../../config/environment/shared').colors;
  this.groups.forEach( function(group, i) {
    // Add color only for group without color
    if(group.vars && !group.vars.group_color) {
      group.vars.group_color = "#" + colors[ i % colors.length ].replace('#', '');
    }
  });
  next();
});

export default mongoose.model('Fleet', FleetSchema);
