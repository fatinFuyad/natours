// const catchAsync = require("../utils/catchAsync");
const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");

// exports.getAllReviews = catchAsync(async (req, res) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: "success",
//     results: reviews.length,
//     data: { reviews },
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  // Adding manually a review when user is not specified is absurd / but for dev
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id; // protect middleware adds user to req
  next();
};

// when a route handler function has some particular code
// that's not present in factory functions;
// then use a middleware to handle it's own particular code so that factory functions can be applied

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
