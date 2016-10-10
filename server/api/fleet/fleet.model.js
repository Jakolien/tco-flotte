'use strict';

import mongoose from 'mongoose';

var GroupSchema = new mongoose.Schema({
  name: String,
  vars: mongoose.Schema.Types.Mixed
}, {
  minimize: false,
  skipVersioning: true
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
  versionKey: 'revision'
})

FleetSchema.virtual('self.link').get(function () {
  return `/api/fleets/${this._id}`
});

export default mongoose.model('Fleet', FleetSchema);
