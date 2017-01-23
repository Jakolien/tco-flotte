import angular from 'angular';


export class MetaDisplayComponent {
  constructor(DynamicInput) {
    'ngInject';
    this.input = new DynamicInput(this.meta);
  }
}

export default angular.module('meta-display', [])
  .component('metaDisplay', {
    template: require('./meta-display.pug'),
    controller: MetaDisplayComponent,
    bindings: {
      meta: '<',
      value: '<'
    }
  })
  .name;
