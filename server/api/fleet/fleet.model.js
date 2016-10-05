'use strict';

import mongoose from 'mongoose';

var FleetSchema = new mongoose.Schema({
  name: String,
  active: Boolean,
  fleet_vars: mongoose.Schema.Types.Mixed,
  groups: mongoose.Schema.Types.Mixed
}, {
  minimize: false,
  versionKey: 'revision'
});

export default mongoose.model('Fleet', FleetSchema);
