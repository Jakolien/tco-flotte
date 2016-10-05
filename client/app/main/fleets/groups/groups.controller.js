'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class FleetsGroupsComponent {
  /*@ngInject*/
  constructor(DynamicInput, $translate) {
    // Only allow preliminary inputs
    this.inputs = _.filter(this.settings, { preliminary: true });
    // Instanciate a DynamicInput using the settings
    this.inputs = _.map(this.inputs, meta => new DynamicInput(meta));
    // The new group we have to create
    this.group = {};
    // Cached input's values
    this._inputValues = {};
    // Dependancies available in instance
    angular.extend(this, { $translate });
    // Bind methods with this instance
    this.getInputValues = this.getInputValues.bind(this);
    this.createGroup = this.createGroup.bind(this);
  }

  getInputValues(input) {
    // Fill the input value for the first time
    if(this._inputValues[input.meta.id] === undefined) {
      // Use the input method
      this._inputValues[input.meta.id] = input.getValues();
    }
    // Extend the translate method with an instant value
    return _.extend(this._inputValues[input.meta.id]);
  }

  createGroup() {
    return this.fleet.groups.create(angular.copy(this.group));
  }
}
