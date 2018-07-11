'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/oekoflotte-dev'
  },

  
  // Server port
  //port: 30010,
  
  // Seed database on startup
  seedDB: false
  
  
  
};
