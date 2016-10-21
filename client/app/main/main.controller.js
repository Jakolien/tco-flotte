export default class MainController {
  /*@ngInject*/
  constructor(fleets) {
    angular.extend(this, { fleets });
  }
}
