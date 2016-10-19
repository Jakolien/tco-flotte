import _ from 'lodash';

export default class PrintComponent {
  /*@ngInject*/
  constructor($stateParams) {
    // Clip option will be pass to the scope
    this.clip = !!$stateParams.clip;
    this.static = !!$stateParams.static;
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true });
  }
}
