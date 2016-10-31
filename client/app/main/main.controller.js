export default class MainController {
  /*@ngInject*/
  constructor(fleets, $state) {
    angular.extend(this, { fleets, $state });
  }
  demo() {
    return this.fleets.demo().then( ()=> this.$state.go('main.fleets') );
  }
}
