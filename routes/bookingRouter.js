const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);
router.get("/checkout-session/:tourId", bookingController.getCheckoutSession);

router.use(authController.restrictTo("admin", "lead-guide"));

router
  .route("/", authController.restrictTo("lead-guide", "admin"))
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

//.route("/:id", authController.restrictTo("admin"))
router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(authController.restrictTo("admin"), bookingController.updateBooking)
  .delete(authController.restrictTo("admin"), bookingController.deleteBooking);

module.exports = router;
