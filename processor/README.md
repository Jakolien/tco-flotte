Computations for the TCO eFleets calculator
===

#### Data Structure

Users can create fleets of vehicles. Each fleet is made of vehicle groups or alternative means of transportation (both are considered to be "vehicle groups" in the code).

Users can modify variables that are related to a specific vehicle group or to the whole fleet.

#### Files

`fleet.js` manages variables related to the whole fleet of vehicle and contains the code that aggregates values of individual vehicle groups.

`vehicle_group.js` computes the result for individual groups.

#### How to create a Fleet object

A new Fleet object accepts a single parameter, which is a Javascript object formated as follows:


```
{
  vars: "",
  groups: [
    {
      "name": "1",
      "vars": {
        "car_type": "klein",
        "energy_type": "diesel",
        "num_of_vehicles": 2,
      }
    },
    {
      "name": "2",
      "vars": {
        "car_type": "klein",
        "energy_type": "benzin",
        "num_of_vehicles": 2,
      }
    },
    {
      "name": "3",
      "vars": {
        "car_type": "klein",
        "energy_type": "BEV",
        "num_of_vehicles": 2,
      }
    },
    {
      "name": "4",
      "vars": {
        "car_type": "mittel",
        "energy_type": "hybrid-benzin",
        "num_of_vehicles": 2,
      }
    },{
      "name": "5",
      "vars": {
        "car_type": "groß",
        "energy_type": "hybrid-diesel",
        "num_of_vehicles": 2,
      }
    }
  ]
}
```

For each vehicle group, `num_of_vehicles`, `car_type` and `energy_type` are mandatory. Other keys can be added ; they are the variables listed [in this spreadsheet](
https://docs.google.com/spreadsheets/d/1jscqGDz5K1avuHvOCP6jOyogmBMlX0oAZhTG7saSFqU/edit#gid=0) whose value for the column "Context" is "VehicleGroup".

For the `vars` object, the key-value pairs that can be added are the variables listed in the same spreadsheet whose value for the column "Context" is "Fleet".

#### Visualizations

The Fleet object computes the values needed for the visualizations, both in the "Fleet data" module and in the final visualizations. The list of possible visualizations can be found [in this spreadsheet](https://docs.google.com/spreadsheets/d/1jscqGDz5K1avuHvOCP6jOyogmBMlX0oAZhTG7saSFqU/edit#gid=1491344505).

The "usage" column indicates whether a graph shall be displayed in the "Fleet Data" module, in the final visualizations or at both places.