'use strict';

import {Router} from 'express';
import * as controller from './page.controller';

var router = new Router();

router.get('/:id/:language', controller.show);

module.exports = router;
