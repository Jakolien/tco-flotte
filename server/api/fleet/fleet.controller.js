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
import mongoose  from 'mongoose';
import jsonpatch from 'fast-json-patch';
import Fleet     from './fleet.model';
import cache     from 'memory-cache';
// import Nightmare from 'nightmare';
// Process fleet object
import FleetProcessor from '../../../processor/fleet.js';
import phantom from 'phantom';
import fs from 'fs';
// An object holding the current promise to print a screen
var printQueue = {};
// Queue state
const QUEUE_DONE = 'done', QUEUE_PENDING = 'pending';
// Print's paper size properties
const PAPER_SIZE = {
  format: "A4",
  orientation: "landscape"
};

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

function handleEntityNotEditable(req, res) {
  return function(entity) {
    if(canUpdate(entity, req)) {
      return entity;
    } else {
      res.status(401).end();
      return null;
    }
  }
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
    res.status(statusCode).json({ error: err.message || err.error || err });
  };
}

function mine(req) {
  // Authenticated user
  if(req.user) {
    return Fleet.find({ owner: req.user._id }).sort( { _id: 1 } ).exec();
  // Explicite set of fleets through a "ids" parameter
} else if(req.query.ids) {
    let ids = req.query.ids.split(',').map(mongoose.Types.ObjectId);
    return Fleet.find( { _id: { $in: ids } } ).sort( { _id: 1 } ).exec();
  } else {
    return Promise.resolve([]);
  }
}

function canUpdate(fleet, req) {
  if(req.user) {
    return fleet.owner === req.user._id;
  } else if(fleet.secret) {
    return fleet.secret === (req.query.secret || req.body.secret);
  } else {
    return false;
  }
}

function findEditableFleet(req, id) {
  // Secret key to edit the fleet
  let secret = req.query.secret || req.body.secret;
  // Using secret
  if(secret) {
    return Fleet.findOne({ _id: id, secret: secret }).exec();
  // Using session
  } else if(req.user) {
    return Fleet.findOne({ _id: id, owner: req.user._id }).exec();
  // Using nothing (can't edit)
  } else {
    return Promise.reject(new Error('Not found or Unauthorized'));
  }
}

function updateEditableFleet(req) {
  // Secret key to edit the fleet
  let secret = req.query.secret || req.body.secret;
  let id = req.params.id || req.body._id;
  let body = req.body;
  // Clean some properties
  if(body.hasOwnProperty('_id')) { delete body._id; }
  if(body.hasOwnProperty('revision')) { delete body.revision; }
  // Add ownership to the fleet
  if(req.user && !body.owner) { body.owner = req.user._id; }
  // Using secret
  if(secret) {
    // Set owner (if any)
    return Fleet.findOneAndUpdate({
         _id: id,
         secret: secret
       }, {
         $set: body,
         $inc: { revision: 1 }
       }, {
         upsert: true,
         setDefaultsOnInsert: true,
         runValidators: true,
         new: true
       }).exec();
  // Using session;
  } else if(req.user) {
    return Fleet.findOneAndUpdate({
          _id: id,
          owner: req.user._id
        }, {
          $set: body,
          $inc: { revision: 1 }
        }, {
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
          new: true
        }).exec()
  // Using nothing (can't edit)
  } else {
    return Promise.reject(new Error('Not found or Unauthorized'));
  }
}

function endNighmareFn(nightmare) {
  return function() {
    // finally cleanup
    nightmare.end();
    // kill the Electron process explicitly to ensure no orphan child processes
    nightmare.proc.disconnect();
    nightmare.proc.kill();
    nightmare.ended = true;
    nightmare = null;
  };
}

// Gets a list of Fleets
export function index(req, res) {
  return mine(req)
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}


// Print a list of Fleets in pdf
export function print(req, res) {
  mine(req).then(function(fleets) {
    // Generate the queue key for this file
    let key = fleets.reduce( (init, f)=> `${init}/${f._id}:${f.revision}`, `pdf/${req.locale}`);
    // Obfuscate the key for better anonymity
    key = require('crypto').createHash('md5').update(key).digest('hex');
    // PDF temporary filename
    let filename = `/tmp/${key}.pdf`;
    // In development, assets are generated through a proxy on port 3000
    let url = req.protocol + '://' + req.get('host').replace(':9000', ':3000');
    // Will hold phantom page and instance
    let sitepage = null;
    let phInstance = null
    // The queue is done and the file exists!
    if(printQueue[key] === QUEUE_DONE && fs.existsSync(filename) ) {
      // Send the result to the user
      res.json({ status: 'done', key: key, url: `${url}/api/fleets/print/${key}` });
    // The file is not pending
    } else if(printQueue[key] !== QUEUE_PENDING) {
      // Mark the queue as undone
      printQueue[key] = QUEUE_PENDING;
      // Send the result to the user with the queue key
      res.json({ status: 'pending', key: key });
      // Start Phantom
      phantom.create()
        .then(instance => (phInstance = instance).createPage())
        .then(page     => sitepage = page)
        .then(page     => sitepage.property('paperSize', PAPER_SIZE) )
        .then(status   => sitepage.property('zoomFactor', 1) )
        .then(page     => sitepage.open(`${url}/#/visualization?language=${req.locale}&ids=${req.query.ids}`))
        .then(function() {
          // Wait a short delay before rendering the page to PDF
          return setTimeout(function() {
            // Now we can render it !
            return sitepage.render(filename).then(function() {
              // Close the page
              sitepage.close();
              // Free Phantom memory
              phInstance.exit();
              // Mark the queue as done
              printQueue[key] = QUEUE_DONE;
            });
          // We wait 4 seconds to ensure all chart are rendered
          }, 4000);
        })
        // Cache errot to exit the Phantom instance
        .catch(e => phInstance.exit());
    // The file is already pending!
    } else {
      // Send the result to the user with the queue key
      res.json({ status: 'pending', key: key });
    }
  });
}

export function download(req, res) {
  // PDF temporary filename
  let filename = `/tmp/${req.params.key}.pdf`;
  // The queue is done and the file exists!
  if(printQueue[req.params.key] === QUEUE_DONE && fs.existsSync(filename) ) {
    delete printQueue[req.params.key];
    // Change content disposition to download the file with a custom name
    res.setHeader('Content-disposition', 'attachment; filename=fleets.pdf');
    res.setHeader('Content-type', 'application/pdf');
    // Then send the file
    res.sendFile(filename);
  } else {
    // Not ready!
    handleError(res)('The file you requested is not in queue or not ready.');
  }
}

// Print a list of Fleets in PNG
export function png(req, res) {
  mine(req).then(function(fleets) {
    // Generate the cache key
    let key = fleets.reduce( (init, f)=> `${init}/${f._id}:${f.revision}`, req.params.meta);;
    // Obfuscate the key for better anonymity
    key = require('crypto').createHash('md5').update(key).digest('hex');
    // Get the image from the cache
    let image = cache.get(key);
    // An image is present in the cache
    if(image) {
      // Send the image
      res.type('png').send(image);
    } else {
      // In development, assets are generated through a proxy on port 3000
      let url = req.protocol + '://' + req.get('host').replace(':9000', ':3000');
      try {
        let nightmare = Nightmare({ width: 800, height: 300 });
        // We open the print view
        nightmare.goto(`${url}/#/print/${req.params.meta}?clip=1&static=0`)
          // Wait a small delay to let angular render the page
          //.wait('.chart--rendered')
          .wait('.print__chart--last .chart--rendered')
          .screenshot(function(err, buffer) {
            if(!err) {
              // Cache for 2 hours
              cache.put(key, buffer, 2*6e4);
              res.type('png').send(buffer);
            } else {
              handleError(res)(err);
            }
          })
          .catch(handleError(res))
          .then(endNighmareFn(nightmare));
      // Catch error with Nightmare
      } catch(err){
        handleError(res)(err);
      }
    }
  });
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
  return findEditableFleet(req, req.params.id)
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
  return findEditableFleet(req, req.params.id)
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
  // Add user as owner if any
  if(req.user) {
    req.body.owner = req.user._id;
  }
  return Fleet.create(req.body)
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Fleet in the DB at the specified ID
export function upsert(req, res) {
  return updateEditableFleet(req)
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Fleet in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
    delete req.body.revision;
  }
  return findEditableFleet(req, req.params.id)
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(handleFleetProcessor(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Fleet from the DB
export function destroy(req, res) {
  return findEditableFleet(req, req.params.id)
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
