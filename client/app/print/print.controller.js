import _ from 'lodash';

export default class PrintComponent {
  /*@ngInject*/
  constructor() {
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true });
  }
}
