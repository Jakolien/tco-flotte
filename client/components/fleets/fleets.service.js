'use strict';
// import _ from 'lodash';

export default function fleetsService(Restangular) {
  'ngInject';
  // Counter for fleets unique name
  var fleetNameCounter = 0;

  class LikeArray {
    constructor(...rest) {
      this._array = new Array(...rest);
      // Bind methods to this instance
      this.all     = this.all.bind(this);
      this.get     = this.get.bind(this);
      this.push    = this.push.bind(this);
      this.slice   = this.slice.bind(this);
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
    slice(...rest) {
      return this._array.slice(...rest);
    }
    length() {
      return this._array.length;
    }

    get(id_or_index) {
      if( isNaN(id_or_index) ) {
        // Search by id
        return _.find(this._array, {_id: id_or_index});
      } else {
        // search by index
        return this._array[id_or_index];
      }
    }
    indexOf(...rest) {
      return this._array.indexOf(...rest);
    }
    create(vars = {}) {
      var length = this.push(vars);
      return this.get(length - 1);
    }
  }

  class FleetGroups extends LikeArray {
    constructor(fleet, ...rest) {
      // Call parents
      super(...rest);
      // Set fleet!
      this._fleet = fleet;
    }
    push(...rest) {
      for(let group of rest) {
        if(group.insights) {
          super.push(group);
        } else {
          let fleet = this._fleet;
          // We add the new group
          let promise = fleet.api().all('groups').post(group);
          // Transform the result of the promise
          promise.then(function(f) {
            // We update the fleet
            fleet.initialize(f);
            // And return the new group
            angular.extend(promise.$object, fleet.groups.slice(-1)[0]);
          });
          super.push(promise.$object);
        }
      }
      return this.length();
    }
  }

  class Fleet {
    initialize(vars = {}) {
      angular.extend(this, vars);
      // Create nested groups (if any)
      if( angular.isArray(this.groups) ) {
        this.groups = new FleetGroups(this, ...this.groups);
      // Create an empty list of groups
      } else {
        this.groups = new FleetGroups(this);
      }
      return this;
    }
    constructor(vars = {}) {
      // Count fleets instances
      ++fleetNameCounter;
      // Bind initialize method
      this.initialize = this.initialize.bind(this);
      // Initialize vars
      this.initialize(vars);
      // We may be awaiting a promise to be resolved
      if( vars.$promise ) {
        vars.$promise.then(this.initialize);
      }
      // Bind method
      this.empty = this.empty.bind(this);
    }
    api() {
      return Restangular.one('fleets', this._id);
    }
    empty() {
      return !this.groups || !this.groups.length || !this.groups.length();
    }
    update() {
      this.save().then(function(vars) {
        this.initialize(vars);
      }.bind(this));
    }
    static uniqueName() {
      return `Fleet ${fleetNameCounter}`
    }
    static defaults() {
      return {
        name: Fleet.uniqueName(),
        vars: {}
      };
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
    push(...rest) {
      for(let fleet of rest) {
        if(fleet._id) {
          super.push(new Fleet(fleet));
        } else {
          // We add the new fleet
          let promise = Restangular.all('fleets').post(fleet);
          // Transform the result of the promise
          promise.$object.$promise = promise
          // Add the future Fleet instance
          super.push(new Fleet(promise.$object));
        }
      }
      return this.length();
    }
    initial(vars = {}) {
      return this.length() ? this.get(0) : this.create(vars);
    }
    create(vars = Fleet.defaults()) {
      return super.create(vars);
    }
  }

  return new Fleets();
}
