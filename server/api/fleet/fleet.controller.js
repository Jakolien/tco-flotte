/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/fleets              ->  index
 * POST    /api/fleets              ->  create
 * GET     /api/fleets/:id          ->  show
 * PUT     /api/fleets/:id          ->  upsert
 * PATCH   /api/fleets/:id          ->  patch
 * DELETE  /api/fleets/:id          ->  destroy
 */

'use strict';

import _         from 'lodash';
import jsonpatch from 'fast-json-patch';
import Fleet     from './fleet.model';
// Process fleet object
import FleetProcessor from '../../../processor/fleet.js';
import Nightmare from 'nightmare';

var nightmare = Nightmare();

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleFleetProcessor(res) {
  function prepare(entity) {
    // Extend the existing fleet object with a processed fleet
    let fleet = _.extend(entity.toObject({ virtuals: true }), new FleetProcessor(entity));
    // Return the new fleet
    return fleet;
  }
  return function(hash) {
    // Given hash is not an array
    if( Object.prototype.toString.call(hash) === '[object Array]' ) {
      // Map the array to process fleets one by one
      return _.map(hash, prepare);
    } else {
      // Prepare the hash directly
      return prepare(hash);
    }
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    console.log(err);
    res.status(statusCode).send(err);
  };
}

function findFleet(id) {
  return function() {
    return Fleet.findById(id).exec();
  };
}

// Gets a list of Fleets
export function index(req, res) {
  return Fleet.find().sort( { _id: 1 } ).exec()
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Print a list of Fleets in pdf
export function print(req, res) {
  let url = req.protocol + '://' + req.get('host');
  nightmare.goto(url + '/#/print')
    .wait(3000)
    .pdf(null, { landscape: true, pageSize: 'A4', printBackground: true }, function(err, buffer) {
      res.type('pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=my-fleets.pdf');
      res.send(buffer);
    })
    .run();
}

// Gets a single Fleet from the DB
export function show(req, res) {
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Fleet from the DB
export function groups(req, res) {
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(handleFleetProcessor(res))
    .then(fleet=> fleet.groups)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function addGroup(req, res) {
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(function(fleet) {
      // Add the group
      fleet.groups.push(req.body);
      // Save the entity
      return fleet.save()
        .then(handleFleetProcessor(res))
        .then(respondWithResult(res));
    })
    .catch(handleError(res));
}

export function destroyGroup(req, res) {
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(function(fleet) {
      // Remove the group
      fleet.groups.remove(req.params.group);
      // Save the entity
      return fleet.save()
        .then(handleFleetProcessor(res))
        .then(respondWithResult(res));
    })
    .catch(handleError(res));
}

// Creates a new Fleet in the DB
export function create(req, res) {
  return Fleet.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Fleet in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Fleet.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true, new: true}).exec()
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Fleet in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Fleet from the DB
export function destroy(req, res) {
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
