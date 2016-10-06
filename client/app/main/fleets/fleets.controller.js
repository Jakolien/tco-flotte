'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class FleetsComponent {
  /*@ngInject*/
  constructor($translate, $state, $stateParams, fleets) {
    // Dependancies available in instance
    angular.extend(this, { $translate, fleets, $state });
    // No group yet
    if( this.fleet.groups.length() === 0 ) {
      // Redirect to the child state to create group
      $state.go('main.fleets.groups', { fleet: $stateParams.fleet || 0 });
    }
  }

  createFleet() {
    this.$state.go('main.fleets', { fleet: this.fleets.push() - 1 });
  }
}
