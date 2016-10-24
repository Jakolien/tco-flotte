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
      email: 'contact@jplusplus.org',
      password: 'test'
    })
    .then((user) => {
      Fleet.find({}).remove()
        .then( ()=> {
          Fleet.create([{
            name: 'Fleet 1',
            active: true,
            vars: {},
            owner: user._id,
            groups: [
              {
                name: "Group A",
                vars: {
                  "energy_type": "benzin",
                  "car_type": "klein",
                  "num_of_vehicles": 1
                },
              }
            ]
          },{
            name: 'Fleet 2',
            active: true,
            vars: {},
            owner: user._id,
            groups: [
              {
                name: "Group B",
                vars: {
                  "energy_type": "benzin",
                  "car_type": "klein",
                  "num_of_vehicles": 1
                },
              },
              {
                name: "Group C",
                vars: {
                  "energy_type": "benzin",
                  "car_type": "klein",
                  "num_of_vehicles": 1
                }
              }
            ]
          }, {
            name: 'Fleet 3',
            active: true,
            vars: {},
            owner: user._id,
            groups: [
              {
                name: "Yolo",
                vars: {
                  "energy_type": "benzin",
                  "car_type": "klein",
                  "num_of_vehicles": 13
                },
              }
            ]
          }]).then(() => {
            console.log('finished populating fleets');
          });
        });
    });
  });
