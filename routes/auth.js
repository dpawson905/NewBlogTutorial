const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  catchAsync
} = require("../middleware");
const {
  loadGoogleLogin,
  googleRegisterOrLogin,
  logout
} = require("../controllers/auth");


router.get("/google", loadGoogleLogin);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    failureFlash: true,
    successFlash: true,
  }),
  catchAsync(googleRegisterOrLogin)
);

router.post('/logout', catchAsync(logout))

module.exports = router;
