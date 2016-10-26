import _ from 'lodash';
import angular from 'angular';

export default class EditComponent {
  /*@ngInject*/
  constructor(DynamicInput, $state, $translate, growl) {
    // Settings must match with the group
    this.settings = _.filter(this.settings, s => s.special === null || s.special === this.group.special);
    // Instanciate a DynamicInput using the settings
    this.inputs = _.map(this.settings, meta => new DynamicInput(meta));
    // Input's context
    this.contextes = [
      {
        name: 'VehicleGroupCommon',
        open: !this.group.special,
        title: $translate.instant('group_general_information_title'),
        values: this.group.vars,
        destination: this.group.vars
      },
      {
        name: 'VehicleGroup',
        open: this.group.special,
        title: $translate.instant('group_variables_all_vehicles_title'),
        values: this.group.insights,
        destination: this.group.vars
      },
      {
        name: 'Fleet',
        open: false,
        title: $translate.instant('group_variables_fleet_title'),
        values: this.fleet.vars,
        destination: this.fleet.vars
      }
    ];
    // Add inputs
    for(let context of this.contextes) {
      // Filter the inputs list by context name
      context.inputs = _.filter(this.inputs, input => input.meta.context === context.name);
      context.sections = _.groupBy(context.inputs, input => input.meta.section);
    }
    // Cached input's values
    this._inputValues = {};
    // Bind methods with this instance
    this.getInputValues = this.getInputValues.bind(this);
    this.changedValues = this.changedValues.bind(this);
    this.hasChanged = this.hasChanged.bind(this);
    this.duplicate = this.duplicate.bind(this);
    this.delete = this.delete.bind(this);
    this.save = this.save.bind(this);
    // Dependancies injected in the instance
    angular.extend(this, { $state, $translate, growl });
  }
  get headingBg() {
    return this.temporaryGroupColor || this.group.vars.group_color;
  }
  get temporaryGroupColor() {
    if(this.contextes[0]._values) {
      return this.contextes[0]._values.group_color;
    }
  }
  isVisible(inputs, values) {
    return _.some(inputs, input => input.isVisible(values));
  }
  getInputValues(input, context) {
    return input.getValues(context._values || context.values);
  }
  gs(context, name) {
    // Dump values inside the value object
    if(!context._dump) {
      // Copy the object to avoid modifying references
      context._values = angular.copy(context.values);
      // We must save the original version to detect changes
      context._dump = angular.copy(context.values);
      // All changed variables will be saved here
      context._changed = {};
    }
    return function(value) {
      if(value !== undefined) {
        // Mark the value as changed
        context._changed[name] = context._dump[name] !== value;
        // Input values
        context._values[name] = value;
      }
      return context._values[name];
    };
  }

  save() {
    // For each context object, we extend the destination object
    for(let context of this.contextes) {
      // Get all variables that changes in this context
      let changed = this.changedValues([context]);
      // To do so, we must pick only the value that changed
      angular.extend(context.destination, _.pick(context._values, changed));
    }
    // Save the fleet!
    // Notify user
    let successMsg = this.$translate.instant('group_saved');
    this.fleet.update().$promise.then( ()=> this.growl.success(successMsg));
    // And redirect to the fleet
    this.$state.go('main.fleets');
  }

  duplicate() {
    this.fleet.groups.create({
      vars: angular.copy(this.group.vars),
      name: this.fleet.groups.nextName()
    });
    // Go to the parent state
    this.$state.go('main.fleets');
  }

  delete() {
    this.fleet.groups.delete(this.group);
    // Go to the parent state
    this.$state.go('main.fleets');
  }

  changedValues(contextes = this.contextes) {
    // All changed values
    let changed = {};
    // Merge changed values
    for(let context of contextes) {
      angular.extend(changed, context._changed);
    }
    return _.chain(changed).pickBy(v => v).keys().value();
  }

  hasChanged() {
    return this.changedValues().length;
  }
}
