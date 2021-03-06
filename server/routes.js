/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'path';
import {authenticate} from './auth/auth.service'

export default function(app) {
  // Insert routes below
  app.use('/api/fleets', authenticate(), require('./api/fleet'));
  app.use('/api/users',  authenticate(), require('./api/user'));
  app.use('/api/pages',  authenticate(), require('./api/page'));

  app.use('/auth', require('./auth').default);

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(`${app.get('appPath')}/index.html`));
    });
}
