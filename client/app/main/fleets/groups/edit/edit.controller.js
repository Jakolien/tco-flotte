export default class EditComponent {
  /*@ngInject*/
  constructor(DynamicInput, $translate) {
    // Instanciate a DynamicInput using the settings
    this.inputs = _.map(this.settings, meta=> new DynamicInput(meta));
    // Input's context
    this.contextes = [
      { name:"Group", open: false, title: "General information" },
      { name:"VehicleGroup", open: true, title: "Variables for all vehicles in this group" },
      { name:"Fleet", open: false, title: "Variables for all vehicles in this fleet" },
      { name:"Company", open: false, title: "Variables for all vehicles in this company" }
    ];
    // Add inputs
    for(let context of this.contextes) {
      // Filter the inputs list by context name
      context.inputs = _.filter(this.inputs, input=> input.meta.context === context.name);
    }
    // Cached input's values
    this._inputValues = {};
    this.values = angular.copy(this.group.insights);
    // Bind methods with this instance
    // this.getInputValues = this.getInputValues.bind(this);
    // Dependancies available in instance
    angular.extend(this, { $translate });
  }

  getInputValues(input) {
    // Fill the input value for the first time
    if(this._inputValues[input.meta.id] === undefined) {
      // Use the input method
      this._inputValues[input.meta.id] = input.getValues();
    }
    return this._inputValues[input.meta.id]
  }
}
