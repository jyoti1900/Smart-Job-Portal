const express = require("express");
const router = express.Router();
const passport = require("../../controller/customer/passport");

// ✅ GOOGLE SIGNUP FLOW
router.get(
  "/google/signup",
  passport.authenticate("google-signup", { scope: ["profile", "email"] })
);

router.get(
  "/google/signup/callback",
  passport.authenticate("google-signup", { session: false }),
  (req, res) => {
    const { success, token, userId, email, message } = req.user || {};

    if (!success) {
      return res.send(`
        <script>
          alert("${message || 'Signup failed'}");
          window.location.href = "http://localhost:3000/signup";
        </script>
      `);
    }

    return res.redirect(
      `http://localhost:3000/alljobs?token=${token}&id=${userId}&email=${email}`
    );
  }
);

// ✅ GOOGLE LOGIN FLOW
router.get(
  "/google/login",
  passport.authenticate("google-login", { scope: ["profile", "email"] })
);

router.get(
  "/google/login/callback",
  passport.authenticate("google-login", { session: false }),
  (req, res) => {
    const { success, token, userId, email, message } = req.user || {};

    if (!success) {
      return res.send(`
        <script>
          alert("${message || 'Login failed'}");
          window.location.href = "http://localhost:3000/login";
        </script>
      `);
    }

    return res.redirect(
      `http://localhost:3000/alljobs?token=${token}&id=${userId}&email=${email}`
    );
  }
);

module.exports = router;
