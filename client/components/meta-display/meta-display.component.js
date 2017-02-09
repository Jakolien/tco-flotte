import angular from 'angular';


export class MetaDisplayComponent {
  constructor(DynamicInput) {
    'ngInject';
    this.input = new DynamicInput(this.meta, this.subset);
    // Ensure the value is well defined
    this.isVisible = this.value !== undefined && this.value !== null;
    this.isVisible = this.isVisible && this.input.isActive();
  }
}

export default angular.module('meta-display', [])
  .component('metaDisplay', {
    template: require('./meta-display.pug'),
    controller: MetaDisplayComponent,
    bindings: {
      meta: '<',
      value: '<',
      subset: '<'
    }
  })
  .name;
