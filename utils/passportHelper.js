const debug = require("debug")("blog:passport");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const User = require("../models/user");

exports.passportInit = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, cb) => {
        await User.findOrCreate(
          {
            googleId: profile.id,
            email: profile._json.email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
          },
          (err, user) => {
            return cb(err, user);
          }
        );
      }
    )
  );

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
  });
};
