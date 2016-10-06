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

import _              from 'lodash';
import jsonpatch      from 'fast-json-patch';
import Fleet          from './fleet.model';
// Process fleet object
import FleetProcessor from '../../../processor/fleet.js'

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
  return function(hash) {
    var result = null;
    // Several entities within an array
    if( Object.prototype.toString.call(hash) === '[object Array]' ) {
      // Map the array to process fleets one by one
      result = _.map(hash, function(entity) {
        return _.extend(entity.toObject(), new FleetProcessor(entity));
      });
    } else {
      delete hash.groups;
      result = _.extend(hash.toObject(), new FleetProcessor(hash) );
    }
    return result;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    console.log(err);
    res.status(statusCode).send(err);
  };
}

// Gets a list of Fleets
export function index(req, res) {
  return Fleet.find().sort( { name: 1 } ).exec()
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Fleet from the DB
export function show(req, res) {
  return Fleet.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
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
  return Fleet.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()

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
