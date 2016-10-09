'use strict';

var express = require('express');
var controller = require('./fleet.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:id/groups', controller.groups);
router.post('/:id/groups', controller.addGroup);
router.post('/', controller.create);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);

module.exports = router;
