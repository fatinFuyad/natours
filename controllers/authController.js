const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/usersModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (res, statusCode, user) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, // send cookie encrypting via https conncetion
    httpOnly: true, // prevent browser from modifying cookie,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; // not sent password in response

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // ⚠️⚠️ prevent users playing admin role
  // creating users directly from req.body any of the user can register role as admin
  // to prevent it, create admin manually set the role to admin from mongodb
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
  });

  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: "success",
  //   token,
  //   data: {
  //     newUser,
  //   },
  // });
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(res, 201, newUser);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email & password exist
  if (!email || !password) {
    return next(new AppError("Please provide your email and password!", 400));
  }

  // 2) check if user exists & password is correct
  // once password is encrypted it can't be converted to original form
  // so to compare, first encrypt the sent password then compare both encrypted password

  const user = await User.findOne({ email }).select("+password"); // manual select
  // const correct = user && (await user.correctPassword(password, user.password));

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid email or password", 401)); // unauthorized
    // not explicitly mention whether the email or password is incorrect as potential attacker will know then which was correct email or password
  }

  // 3) if everything is ok, send the token to the client
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  createSendToken(res, 200, user);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    // res.redirect("/");
    return next(new AppError("You're not logged in! Please log in to get access.", 401));
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token does no longer exist", 401)
    );
  }

  // 4) Check if user changed password after token was issued
  // after login, user might change password and then the token also needs to be changed
  // otherwise if someone gets the jwt token he can have access.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // 🆗grant access to the protected routes
  req.user = currentUser;
  res.locals.user = currentUser; // making available user to account templates or so
  next();
});

// no error should be passed to or created
exports.isLoggedIn = async (req, res, next) => {
  if (!req.cookies.jwt) {
    return next();
  }
  const token = req.cookies.jwt;

  try {
    // 1) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // JsonWebTokenError :jwt malformed; we would get this error if token is not created correctly

    // 2) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      // create no err, but simply pass to the next middleware
      return next();
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    res.locals.user = currentUser; // res.locals will be available to pug templates
    next();
  } catch (error) {
    return next();
  }
};

exports.logout = function (req, res) {
  // sent dami token
  // res.cookie("jwt", "logoutuser", {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.clearCookie("jwt"); // clearCookie removes cookie from browser

  res.status(200).json({
    status: "success",
  });
};

exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    // roles:['admin','lead-guide','guide','user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action!", 403)
        // forbidden
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(new AppError("There is no user with that email", 404));
  }

  // 2) generate random reset token
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token to user's email
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: "Your password reset token (valid for 10 minutes)",
    //   message,
    // });
    console.log(resetURL);
    await new Email(user, resetURL).sendResetPassword();
    // to finish the req-res cycle, it's necesary to send res
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    // in case there is an error while sending the email, then we remove the token and expiry time form the user's doc
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(
      new AppError(
        "There was an error while sending the email. Try again later!",
        // error,
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired, and there is user, set new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // while saving, the model validation will run, also pre middleware

  // 3) update passwordChangedAt property for user
  // Login user, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  createSendToken(res, 200, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If correct, update password
  //⚠️⚠️🐞🐞
  // encrypting password twice, hence after updating password, it was always incorrect
  // user.password = await bcrypt.hash(password, 10);

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  //  4) Log in user, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  createSendToken(res, 200, user);
});
