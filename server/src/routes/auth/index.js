import express from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oidc';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import config from '../../../config.json' assert { type: 'json' };
import Debug from 'debug';
import { getIdFromCredentials, getUser, addUser } from '../../db.js';

const debug = Debug('auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login requests per windowMs
  message: 'Too many requests, please try again later',
});

function initializePassport(app) {
  app.use(passport.initialize());
  app.use(passport.session());
}

// Every api request will be rate limited
router.use(apiLimiter);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = getUser(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
    },
    function verify(issuer, profile, cb) {
      debug('verifying google login');
      const userID = getIdFromCredentials(issuer, profile.id);
      if (userID) {
        const user = getUser(userID);
        debug('user found');
        return cb(null, user);
      }
      debug('user not found');
      // const newUser = addUser(issuer, profile.id, `bobv${profile.id}`);
      debug('new user added with id: ' + newUser.id);
      return cb(null, newUser);
    },
  ),
);

passport.use(
  new FacebookStrategy(
    {
      clientID: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
    },
    function verify(accessToken, refreshToken, profile, cb) {
      debug('verifying facebook login');
      const userID = getIdFromCredentials('facebook', profile.id);
      if (userID) {
        const user = getUser(userID);
        debug('user found');
        return cb(null, user);
      }
      debug('user not found');
      const newUser = addUser('facebook', profile.id, `bobv${profile.id}`);
      debug('new user added with id: ' + newUser.id);
      return cb(null, newUser);
    },
  ),
);

router.get('/login/google', passport.authenticate('google'));

router.get('/login/facebook', passport.authenticate('facebook'));

router.get(
  '/redirect/google',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: 'Failed to log in',
  }),
  (_req, res) => {
    debug('redirected from google');
    res.redirect('/');
  },
);

router.get(
  '/redirect/facebook',
  passport.authenticate('facebook', {
    failureRedirect: '/login',
    failureMessage: 'Failed to log in',
  }),
  (_req, res) => {
    debug('redirected from facebook');
    res.redirect('/');
  },
);

export default router;
export { initializePassport };
