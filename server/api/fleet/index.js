'use strict';

var express = require('express');
var controller = require('./fleet.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/print', controller.print);
router.get('/print/:key', controller.download);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);
router.get('/:id/groups', controller.groups);
router.post('/:id/groups', controller.addGroup);
router.delete('/:id/groups/:group', controller.destroyGroup);

module.exports = router;
