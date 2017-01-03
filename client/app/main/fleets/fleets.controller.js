'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class FleetsComponent {
  /*@ngInject*/
  constructor($translate, $state, $stateParams, $uibModal, fleets, $scope) {
    // Bind method to this instance
    this.get               = this.get.bind(this);
    this.createFleet       = this.createFleet.bind(this);
    this.compareStyle      = this.compareStyle.bind(this);
    this.anotherFleet      = this.anotherFleet.bind(this);
    this.biggest           = this.biggest.bind(this);
    this.smallest          = this.smallest.bind(this);
    this.delta             = this.delta.bind(this);
    this.arefleetsUnequal  = this.arefleetsUnequal.bind(this);
    this.hasUnequalWarning = this.hasUnequalWarning.bind(this);
    this.delete            = this.delete.bind(this);
    this.duplicate         = this.duplicate.bind(this);
    this.duplicateGroup    = this.duplicateGroup.bind(this);
    this.canAddGroup       = this.canAddGroup.bind(this);
    this.groupIndex        = this.groupIndex.bind(this);
    this.optimise          = this.optimise.bind(this);
    // Dependancies available in instance
    angular.extend(this, { $translate, fleets, $state, $uibModal });
    // Compare with another fleet
    fleets.compared = this.compareWith = this.anotherFleet();
    // List of variables visualized in "fleet data"
    this.fleetdata = _.filter(this.display, { fleetdata: true });
    // No group yet
    if( this.fleet && this.fleet.groups.filter({ special: false }).length === 0 ) {
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

  compareStyle(fleet, tco) {
    let max = _.maxBy([this.fleet, this.compareWith], f=> this.get(f, tco));
    return {
      width: this.get(fleet, tco)/this.get(max, tco)  * 100 + '%'
    }
  }

  get(fleet, tco) {
    return ( (fleet || {}).TCO  || {})[tco] || 0;
  }

  anotherFleet() {
    if( [undefined, null, this.fleet].indexOf(this.fleets.compared) === -1) {
      return this.fleets.compared;
    } else {
      return _.chain(this.fleets.all()).without(this.fleet).head().value();
    }
  }
  reflectsComparaison() {
    this.fleets.compared = this.compareWith;
  }
  arefleetsUnequal(tco) {
    return this.get(this.fleet, tco) !== this.get(this.compareWith, tco);
  }
  hasUnequalWarning(meta) {
    return meta.name == 'mileage_with_savings' && this.arefleetsUnequal(meta.name);
  }

  biggest(tco) {
    return _.maxBy([this.fleet, this.compareWith], f=> this.get(f, tco));
  }

  smallest(tco) {
    return _.minBy([this.fleet, this.compareWith], f=> this.get(f, tco));
  }

  delta(tco) {
    return this.get(this.biggest(tco), tco) - this.get(this.smallest(tco), tco);
  }

  optimise() {
    this.$uibModal.open({
      template: require('./optimise.pug'),
      size: 'md',
      controllerAs: '$ctrl',
      controller: function($uibModalInstance) {
        'ngInject';
        this.close = $uibModalInstance.close;
      }
    });
  }

  duplicate() {
    this.fleets.create({
      vars: angular.copy(this.fleet.vars),
      groups: angular.copy(this.fleet.groups.all()),
      name: this.fleets.uniqueName()
    }).$promise.then(function(fleet) {
      // Go to the parent state
      this.$state.go('main.fleets', { fleet: fleet._id });
    }.bind(this));
  }


  duplicateGroup(group) {
    // Copy vars with a new name
    const vars = angular.extend(angular.copy(group.vars), {
      // The new name is prefixed
      group_name: `${group.vars.group_name} (copy)`
    });
    // Create the group
    this.fleet.groups.create({
      vars: vars,
      name: vars.group_name
    // We wait for the new group to be created
    }).$promise.then( ()=> {
      const group = this.fleet.groups.length() - 1;
      // Then we move to that group edit form
      this.$state.go('main.fleets.groups.edit', { group });
    });
  }

  groupIndex(group) {
    return this.fleet.groups.indexOf(group);
  }

  canAddGroup() {
    return this.fleet.groups.filter({ special: false }).length < 5
  }

  delete() {
    this.fleets.delete(this.fleet);
    // Go to the parent state
    this.$state.go('main.fleets', { fleet: null }, { reload: 'main.fleets' });
  }
}
