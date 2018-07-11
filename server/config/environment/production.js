'use strict';
/*eslint no-process-env:0*/

// Production specific configuration
// =================================
module.exports = {
  // Seed database on startup
  seedDB: false,
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP
    || process.env.ip
    || undefined,

  // Server port
  port: 30010,

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/oekoflotte'
  }
};
