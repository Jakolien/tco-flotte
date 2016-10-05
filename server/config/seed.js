/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
import User from '../api/user/user.model';
import Fleet from '../api/fleet/fleet.model';

User.find({}).remove()
  .then( ()=> {
    User.create({
      provider: 'local',
      username: 'test',
      password: 'test'
    })
    .then(() => {
      console.log('finished populating users');
    });
  });

Fleet.find({}).remove()
  .then( ()=> {
    Fleet.create([{
      name: 'Fleet 1',
      active: true,
      fleet_vars: {},
        groups: {}
    },{
      name: 'Fleet 2',
      active: true,
      fleet_vars: {},
      groups: {
        "Group A": {
          "energy_type": "benzin",
          "car_type": "klein",
          "num_of_vehicles": 1
        },
        "Group B": {
          "energy_type": "benzin",
          "car_type": "klein",
          "num_of_vehicles": 1
        },
        "Group C": {
          "energy_type": "benzin",
          "car_type": "klein",
          "num_of_vehicles": 1
        }
      }
    }, {
      name: 'Fleet 3',
      active: true,
      fleet_vars: {},
      groups: {}
    }]).then(() => {
      console.log('finished populating fleets');
    });
  });
