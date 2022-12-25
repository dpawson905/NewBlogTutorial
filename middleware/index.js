const User = require("../models/user");

module.exports.catchAsync = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch(next);
  };
};

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be signed in first!");
    return res.redirect("/login");
  }
  next();
};

module.exports.checkIfNotVerified = async (req, res, next) => {
  let user = await User.findOne({ username: req.body.username });
  if (!user) return next();
  if (user && !user.isVerified) {
    req.flash(
      "error",
      `Your account is not active. Check your email to verify your account`
    );
    return res.redirect("/campgrounds");
  }
  return next();
};
