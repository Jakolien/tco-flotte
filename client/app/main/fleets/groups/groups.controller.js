'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class FleetsGroupsComponent {
  /*@ngInject*/
  constructor(DynamicInput, $translate, $state, growl) {
    // Dependancies available in instance
    angular.extend(this, { $translate, $state, growl});
    // Bind methods with this instance
    this.getInputValues = this.getInputValues.bind(this);
    this.createGroup = this.createGroup.bind(this);
    // Only allow preliminary inputs
    this.inputs = _.filter(this.settings, { preliminary: true, special: false });
    // Instanciate a DynamicInput using the settings
    this.inputs = _.map(this.inputs, meta => new DynamicInput(meta));
    // The new group we have to create
    this.group = {};
  }
  getInputValues(input) {
    return input.getValues(this.group);
  }

  createGroup(nextState) {
    let group = this.fleet.groups.create({
      vars: angular.copy(this.group),
      name: this.fleet.groups.nextName()
    });
    // Notify user
    let successMsg = this.$translate.instant('group_added');
    //
    group.$promise.then( group => {
      this.growl.success(successMsg);
      // A next state is given
      if(nextState) {
        // Go to the given state
        this.$state.go(nextState, {}, { reload: nextState });
      } else {
        let index = this.fleet.groups.length() - 1;
        // Go to the group edit form
        this.$state.go('main.fleets.groups.edit', { group: index });
      }
    });
  }
}
