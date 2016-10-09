'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class FleetsComponent {
  /*@ngInject*/
  constructor($translate, $state, $stateParams, fleets) {
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
}
