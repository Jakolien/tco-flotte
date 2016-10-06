'use strict';
// import _ from 'lodash';

// Counter for fleets unique name
var fleetNameCounter = 0;

class LikeArray {
  constructor(...rest) {
    this._array = new Array(...rest);
    // Bind methods to this instance
    this.all     = this.all.bind(this);
    this.get     = this.get.bind(this);
    this.push    = this.push.bind(this);
    this.create  = this.create.bind(this);
    this.indexOf = this.indexOf.bind(this);
    this.length  = this.length.bind(this);
  }
  all() {
    return this._array;
  }
  push(...rest) {
    return this._array.push(...rest);
  }
  length() {
    return this._array.length;
  }
  get(index) {
    return this._array[index];
  }
  indexOf(...rest) {
    return this._array.indexOf(...rest);
  }
  create(vars) {
    var length = this.push(vars);
    return this.get(length - 1);
  }
}

class FleetGroups extends LikeArray { }

class Fleet {
  constructor(vars = {}) {
    angular.extend(this, vars);
    // Create nested groups (if any)
    if( angular.isArray(this.groups) ) {
      this.groups = new FleetGroups(...this.groups);
    // Convert groups from object (if any)
    } else if( angular.isObject(this.groups) ) {
      this.groups = new FleetGroups(..._.values(this.groups));
    // Create an empty list of groups
    } else {
      this.groups = new FleetGroups();
    }
    // Choose a name?
    if( !this.name ) {
      this.name = Fleet.uniqueName()
    }
  }

  static uniqueName() {
    ++fleetNameCounter;
    return `Fleet ${fleetNameCounter}`
  }
}

class Fleets extends LikeArray {
  constructor() {
    // Parent constructor
    super();
    // Bind methods to this instance
    this.push = this.push.bind(this);
    this.initial =  this.initial.bind(this);
  }
  push(vars = {}) {
    return super.push(new Fleet(vars));
  }
  initial(vars = {}) {
    return this.length() ? this.get(0) : this.create(vars);
  }
}

/*@ngInject*/
export default function fleetsService() {
  return new Fleets();
}
