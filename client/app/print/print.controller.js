import _ from 'lodash';

export default class PrintComponent {
  /*@ngInject*/
  constructor($stateParams) {
    // Pass state params to scope
    if( $stateParams.meta ) {
      this.meta = _.find(this.display, { name: $stateParams.meta });
    }
    // Clip option will be pass to the scope
    this.clip = !!$stateParams.clip;      
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true });
  }
}
