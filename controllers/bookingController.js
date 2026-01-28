const Stripe = require("stripe");
const Tour = require("../models/toursModel");
const catchAsync = require("../utils/catchAsync");
const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res) => {
  // 1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) create checkout session
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}?tour=${req.params.tourId}&user=${req.user._id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100, // stripe counts price as cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3) send checkout session as response
  res.status(200).json({
    status: "success",
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });

  // next(); // redirecting to homepage(/) and removing the parameters
  // res.redirect(`${req.originalUrl.split("?")[0]}`);
  res.redirect(`${req.protocol}://${req.get("host")}/my-bookings`);

  // redirecting will make another call to the root api, and for the second time there will be no parameter so it will eventually call next() and reach next middlewars and show homepage
});

exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
