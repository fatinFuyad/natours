const Booking = require("../models/bookingModel");
const Tour = require("../models/toursModel");
const User = require("../models/usersModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get Tour data from collection
  const tours = await Tour.find();

  // 2) Build Template
  // 3) Render template with the Tour data got from (1)
  res.status(200).render("overview", { title: "All Tours", tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data, for the requested tour (includes- reivews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    select: "rating review user",
  });
  console.log({ locations: tour.locations, startLocation: tour.startLocation });

  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  // 2) Build template
  // 3) Render template using the data from (1)
  res.status(200).render("tour", { title: tour.name, tour });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", { title: "Log into your account" });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", { title: "Your account" });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  // console.log(updatedUser);
  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});

exports.getBookings = catchAsync(async (req, res, next) => {
  // 1) Get user from Booking collection
  const bookings = await Booking.find({ user: req.user._id });
  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour._id);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  console.log({ tourIDs, tours });
  // 3) Render template with the Tour data got from (1)
  res.status(200).render("overview", { title: "My Bookings", tours });
});
