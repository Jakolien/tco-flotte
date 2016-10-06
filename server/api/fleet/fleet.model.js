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
  vars: mongoose.Schema.Types.Mixed,
  groups: [GroupSchema]
}, {
  minimize: false,
  versionKey: 'revision'
});

export default mongoose.model('Fleet', FleetSchema);
