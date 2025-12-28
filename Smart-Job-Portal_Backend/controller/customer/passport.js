const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserModel = require("../../database/models/users");
const jwt = require("jsonwebtoken");

// Google Signup Strategy
passport.use(
  "google-signup",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.SIGNUP_CLIENT_URL,
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || "Google User";
        const photo = profile.photos?.[0]?.value || "";

        if (!email) {
          return done(null, { success: false, message: "Email not found in Google account" });
        }

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
          return done(null, {
            success: false,
            message: "User already exists. Please login instead."
          });
        }

        // ✅ No password needed → Schema default will apply ✅
        const user = await UserModel.create({
          googleId,
          name,
          email,
          user_type: "job_seeker",
          profile_image: photo
        });

        const payload = { _id: user._id, email: user.email };
        const token = jwt.sign({ data: payload }, process.env.KEY, {
          expiresIn: "24h"
        });

        return done(null, {
          success: true,
          token,
          userId: user._id,
          email: user.email
        });

      } catch (error) {
        console.error("Google Signup Error:", error);
        return done(error, null);
      }
    }
  )
);


passport.use(
  "google-login",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.LOGIN_CLIENT_URL,
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || "Google User";
        const photo = profile.photos?.[0]?.value || "";

        if (!email) {
          return done(null, { success: false, message: "Email not found" });
        }

        let user = await UserModel.findOne({ email });

        if (!user) {
          return done(null, {
            success: false,
            message: "User not found. Please signup first."
          });
        }

        // Update missing fields
        if (!user.googleId) user.googleId = googleId;
        if (!user.name) user.name = name;
        if (photo) user.profile_image = photo;

        await user.save();

        const payload = { _id: user._id, email: user.email };
        const token = jwt.sign({ data: payload }, process.env.KEY, {
          expiresIn: "24h"
        });

        return done(null, {
          success: true,
          token,
          userId: user._id,
          email: user.email
        });

      } catch (error) {
        console.error("Google Login Error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;

