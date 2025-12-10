import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

// Function to initialize OAuth strategies - call this AFTER dotenv.config()
export function initializeStrategies() {
  // Only enable Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here') {

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              // User exists, return user
              return done(null, user);
            }

            // Check if user exists with this email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // User exists with this email, link Google account
              user.googleId = profile.id;
              user.avatar = profile.photos[0]?.value;
              await user.save();
              return done(null, user);
            }

            // Create new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0]?.value,
              password: Math.random().toString(36).slice(-8), // Random password for Google users
              isEmailVerified: true // Google emails are already verified
            });

            done(null, user);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );

    console.log('✅ Google OAuth enabled');
  } else {
    console.log('⚠️  Google OAuth disabled - Add credentials to .env to enable');
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID &&
      process.env.FACEBOOK_APP_ID !== 'your_facebook_app_id_here' &&
      process.env.FACEBOOK_APP_SECRET &&
      process.env.FACEBOOK_APP_SECRET !== 'your_facebook_app_secret_here') {

    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'displayName', 'email', 'picture.type(large)']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists with this Facebook ID
            let user = await User.findOne({ facebookId: profile.id });

            if (user) {
              // User exists, return user
              return done(null, user);
            }

            // Check if user exists with this email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
              user = await User.findOne({ email });

              if (user) {
                // User exists with this email, link Facebook account
                user.facebookId = profile.id;
                user.avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
                await user.save();
                return done(null, user);
              }
            }

            // Create new user
            user = await User.create({
              facebookId: profile.id,
              name: profile.displayName,
              email: email || `facebook_${profile.id}@placeholder.com`,
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              password: Math.random().toString(36).slice(-8), // Random password for Facebook users
              isEmailVerified: email ? true : false // Verify if email provided
            });

            done(null, user);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );

    console.log('✅ Facebook OAuth enabled');
  } else {
    console.log('⚠️  Facebook OAuth disabled - Add credentials to .env to enable');
  }
}

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
