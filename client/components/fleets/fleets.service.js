'use strict';

import _ from 'lodash';
import Lawnchair from 'lawnchair';
import angular from 'angular';

export default function fleetsService(Restangular, $q) {
  'ngInject';
  // We store secret with Lauwnchair
  var store = new Lawnchair(angular.noop);
  // Counter for fleets unique name
  var fleetNameCounter = 0;
  // Symbol keys for private attributes
  const _array = Symbol('_fleet');
  const _fleet = Symbol('_fleet');
  const KEYS_BLACKLIST = ['fleet_presets', 'energy_known_prices',
                          'insights', 'TCO', 'energy_prices_evolution'];
  class LikeArray {
    constructor(...rest) {
      this[_array] = new Array(...rest);
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
      return this[_array];
    }
    filter(filter) {
      return _.filter(this.all(), filter);
    }
    push(...rest) {
      return this.all().push(...rest);
    }
    slice(...rest) {
      return this.all().slice(...rest);
    }
    delete(item) {
      return _.remove(this.all(), item);
    }
    length(filter = null) {
      return filter === null ? this.all().length : this.filter(filter).length;
    }
    empty() {
      this[_array] = [];
    }
    get(idOrIndex) {
      if( isNaN(idOrIndex) ) {
        // Search by id
        return _.find(this.all(), {_id: idOrIndex});
      } else {
        // search by index
        return this.all()[idOrIndex];
      }
    }
    indexOf(item) {
      return this.all().indexOf(item);
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
      this[_fleet] = fleet;
    }
    nextName() {
      return 'Group ' + ( this.filter({ special: false }).length + 1 )
    }
    delete(group) {
      this[_fleet].api().one('groups', group._id).remove();
      return super.delete(group);
    }
    push(...rest) {
      for(let group of rest) {
        if(group.insights) {
          super.push(group);
        } else {
          let fleet = this[_fleet];
          // We add the new group
          let promise = fleet.api().post('groups', group, { secret: fleet.secret });
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
      // Save the secret (if any)
      this.initSecret();
      // Return the instance
      return this;
    }
    constructor(vars = {}) {
      // Count fleets instances
      ++fleetNameCounter;
      // Bind methods
      this.initialize = this.initialize.bind(this);
      this.update = this.update.bind(this);
      this.update = this.update.bind(this);
      this.clean = this.clean.bind(this);
      this.empty = this.empty.bind(this);
      this.api = this.api.bind(this);
      // Initialize vars
      this.initialize(vars);
      // We may be awaiting a promise to be resolved
      if( vars.$promise ) {
        vars.$promise.then(this.initialize);
      // We create a name for this fleet
      } else if( !this.name ) {
        this.name = this.uniqueName();
      }
    }
    initSecret() {
      // This fleet has a secret and no owner
      if(this.secret && !this.owner) {
        // Save the fleet secret for later
        store.save({ key: this._id, secret: this.secret });
      // This fleet has an owner
      } else if (this.owner) {
        // Remove any existing record
        store.remove(this._id);
      // This fleet has no secret nor an owner
      } else {
        store.get(this._id, function(record) {
          // The fleet has now an owner!
          if(record && record.secret) {
            // Save the secret locally (shouldn't change)
            this.secret = record.secret;
          }
        }.bind(this));
      }
    }
    api() {
      return Restangular.one('fleets', this._id);
    }
    empty() {
      return !this.groups || !this.groups.length || !this.groups.length();
    }
    update() {
      this.save({ secret: this.secret }).then(function(vars) {
        this.initialize(vars);
      }.bind(this));
    }
    clean() {
      // Clean the fleet
      let cleaned = _.pickBy(this.plain(), function(value, key) {
          return KEYS_BLACKLIST.indexOf(key) === -1;
      });
      // Clean its groups
      cleaned.groups = _.map(cleaned.groups, function(group) {
        return _.pickBy(group, function(value, key) {
            return KEYS_BLACKLIST.indexOf(key) === -1;
        });
      });
      // Return a new restangularized element
      return Restangular.restangularizeElement(null, cleaned);
    }
    static uniqueName() {
      return `Fleet ${fleetNameCounter}`;
    }
    static defaults() {
      return {
        name: Fleet.uniqueName(),
        vars: {},
        groups: []
      };
    }
  }

  class Fleets extends LikeArray {
    constructor() {
      // Parent constructor
      super();
      // Bind methods to this instance
      this.push = this.push.bind(this);
      this.purge =  this.purge.bind(this);
      this.initial =  this.initial.bind(this);
    }
    purge() {
      this[_array] = [];
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
    initial(vars) {
      let init = this.length() ? this.get(0) : this.create(vars);
      // Intial object must have a promise
      init.$promise = init.$promise ? init.$promise : $q(resolve => resolve(init));
      // Return the object
      return init;
    }
    find(idOrIndex) {
      // Find the fleet locally
      let local = super.get(idOrIndex);
      // It exists
      if(local) {
        return $q(resolve => resolve(local));
      } else {
        return Restangular.one('fleets', idOrIndex).get().then(function(fleet) {
          return this.create(fleet);
        }.bind(this));
      }
    }
    create(vars = Fleet.defaults()) {
      return super.create(vars);
    }
    get ids() {
      return this.all().map(f => f._id);
    }
    get store() {
      return store;
    }
  }

  return new Fleets();
}
