export default class MainController {
  /*@ngInject*/
  constructor(fleets, $state) {
    angular.extend(this, { fleets, $state });
  }
  demo() {
    this.fleets.demo()
    this.$state.go('main.fleets');
  }
}
