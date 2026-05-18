import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';

export const configurePassport = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const avatar = profile.photos?.[0]?.value;

      // Case 1: User already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      if (user) return done(null, user);

      // Case 2: User registered manually with same email
      if (email) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.avatar = avatar;
          user.authProvider = 'google';
          await user.save();
          return done(null, user);
        }
      }

      // Case 3: Brand new user via Google
      const username = email
        ? email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 6)
        : 'user_' + Math.random().toString(36).slice(2, 8);

      const newUser = await User.create({
        name: profile.displayName || username,
        username,
        email,
        googleId: profile.id,
        avatar,
        authProvider: 'google',
        password: null, // Note: Schema now allows optional password
      });

      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }));

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

export default passport;
