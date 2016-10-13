'use strict';
import _ from 'lodash';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor() {
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true });
  }
}
