'use strict';
import _ from 'lodash';

export default class FleetsComponent {
  /*@ngInject*/
  constructor(DynamicInput) {
    // Only allow preliminary inputs
    this.inputs = _.filter(this.settings, { preliminary: true });
    // Instanciate a DynamicInput using the settings
    this.inputs = _.map(this.inputs, meta => new DynamicInput(meta));
  }
}
