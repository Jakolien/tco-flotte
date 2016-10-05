'use strict';
import _ from 'lodash';

class Fleets extends Array {
  constructor() {
    super()
  }
}

/*@ngInject*/
export default function fleetsService() {
  return new Fleets();
}
