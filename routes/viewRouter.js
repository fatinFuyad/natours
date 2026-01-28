const express = require("express");
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
  getBookings,
} = require("../controllers/viewsController");
const { isLoggedIn, protect } = require("../controllers/authController");
const { createBookingCheckout } = require("../controllers/bookingController");

const router = express.Router();

// router.use(isLoggedIn); // to prevent query twice in /me route
router.get("/", createBookingCheckout, isLoggedIn, getOverview);
router.get("/tours/:slug", isLoggedIn, getTour);
router.get("/login", isLoggedIn, getLoginForm);
router.get("/me", protect, getAccount);
router.get("/my-bookings", protect, getBookings);

router.post("/submit-user-data", protect, updateUserData);

module.exports = router;
