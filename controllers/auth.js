const passport = require("passport");

const User = require("../models/user");

exports.loadGoogleLogin = async (req, res, next) => {
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })(req, res, next);
};

exports.googleRegisterOrLogin = async (req, res, next) => {
  try {
    await changeUserStatus(req, true);
    req.toastr.success(
      `${`Welcome back ${req.user.firstName}!`}`,
      (title = "Login Success")
    );
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  } catch (err) {
    console.log(err);
    return res.redirect("/");
  }
};

exports.logout = async (req, res) => {
  await changeUserStatus(req, false);
  req.logout(() => {
    req.toastr.success(
      "See you next time!",
      (title = "Logout Success")
    );
    res.redirect("/");
  });
};

async function changeUserStatus(r, status) {
  let user = await User.findById(r.user);
  user.online = status;
  await user.save();
}
