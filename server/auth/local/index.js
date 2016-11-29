'use strict';

import express     from 'express';
import passport    from 'passport';
import async       from 'async';
import crypto      from 'crypto';
import User        from '../../api/user/user.model';
import {signToken} from '../auth.service';
import mailer      from '../../components/mailer';


var router = express.Router();

router.post('/', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    var error = err || info;
    if(error) {
      return res.status(401).json({message: res.__mf('password_not_correct') });
    }
    if(!user) {
      return res.status(404).json({message: res.__mf('something_is_wrong') });
    }

    var token = signToken(user._id, user.role);
    res.json({ token });
    return null;
  })(req, res, next);
});

router.all('/forgot', function(req, res) {
  async.waterfall([
    // Create token
    function(done) {
      // Send the buffer dyrectly to callback function
      crypto.randomBytes(20, done);
    // Set user token
    }, function(buff, done) {
      // Gets email from body or query
      let email = req.body.email || req.query.email
      // Find the user using the provided email
      User.findOne({ email: email }, function(err, user) {
        // User not found
        if (!user) { return res.status(404).json({message: res.__mf('user_not_found') }); }
        // Transform buffer to string
        let token = buff.toString('hex');
        // Set the data values to reset the password
        user.resetPasswordToken = token;
         // Expire in 24 hours
        user.resetPasswordExpires = Date.now() + 1000 * 6 * 60 * 24;
        // Save and continue
        user.save(err => done(err, token, user));
      });
    // Send token by email
    }, function(token, user, done) {
      // In development, assets are generated through a proxy on port 3000
      let url = req.protocol + '://' + req.get('host').replace(':9000', ':3000');
      // Add token path to the url
      url += `/#/reset/${token}`;
      // Send the email and continue
      mailer.sendMail({
        to: user.email,
        from: 'contact@jplusplus.org',
        subject: res.__mf('reset_your_password_subject'),
        text: res.__mf('reset_your_password_body', { url: url })
      }, done);
    }
  ], function(err) {
    res.json({ ok: !err, message: err });
  });
});

router.all('/reset/:token', function(req, res) {
  async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          // User not found
          if (!user) { return res.status(404).json({message: res.__mf('user_token_not_found') }); }
          // Change the password
          user.password = req.body.password || req.query.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          // Save the user and log her in
          user.save(err => done(err, user) );
        });
    }
  ], function(err) {
    res.json({ ok: !err, message: err });
  });
});

export default router;
