'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class FleetsComponent {
  /*@ngInject*/
  constructor($translate, $state, $stateParams, fleets) {
    // Bind method to this instance
    this.createFleet = this.createFleet.bind(this);
    this.compareStyle = this.compareStyle.bind(this);
    this.anotherFleet = this.anotherFleet.bind(this);    
    this.biggest = this.biggest.bind(this);
    this.smallest = this.smallest.bind(this);
    this.delta = this.delta.bind(this);
    this.arefleetsUnequal = this.arefleetsUnequal.bind(this);
    // Dependancies available in instance
    angular.extend(this, { $translate, fleets, $state });
    // No group yet
    if( this.fleet && this.fleet.empty() ) {
      // Redirect to the child state to create group
      $state.go('main.fleets.groups', { fleet: this.fleet._id });
    }
  }

  createFleet() {
    let nextFleetIndex = this.fleets.length();
    // Create an empty fleet
    this.fleets.create().$promise.then(function(fleet) {
      // Redirect to that fleet
      this.$state.go('main.fleets', { fleet: fleet._id });
      return fleet;
    }.bind(this));
  }

  compareStyle(fleet, predicate = angular.noop) {
    let max = _.maxBy([this.fleet, this.compareWith], predicate);
    return {
      width: predicate(fleet)/predicate(max)  * 100 + '%'
    }
  }

  mileage(fleet) {
    return fleet.TCO.mileage;
  }

  vehicles(fleet) {
    return fleet.TCO.num_of_vehicles;
  }

  anotherFleet() {
    return _.chain(this.fleets.all()).without(this.fleet).head().value();
  }

  arefleetsUnequal(predicate = angular.noop) {
    return predicate(this.fleet) !== predicate(this.compareWith);
  }

  biggest(predicate = angular.noop) {
    return _.maxBy([this.fleet, this.compareWith], predicate);
  }

  smallest(predicate = angular.noop) {
    return _.minBy([this.fleet, this.compareWith], predicate);
  }

  delta(predicate = angular.noop) {
    return predicate( this.biggest(predicate) ) - predicate( this.smallest(predicate) );
  }
}
