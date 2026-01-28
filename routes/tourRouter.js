const express = require("express");
const reveiwRouter = require("./reviewRouter");
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getToursStats,
  getToursPlan,
  getToursWithin,
  getTourDistances,
  uploadTourImages,
  resizeTourImages,
} = require("../controllers/tourController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router(); // router is also a middleware
// router.param("id", checkId); // checkId is a middleware that checks if the id is valid

router.use(protect);
router.use("/:tourId/reviews", reveiwRouter); // merged two router for specified path

router.route("/tours-stats").get(getToursStats);
router
  .route("/toursPlan/:year")
  .get(restrictTo("admin", "lead-guide", "guide"), getToursPlan);
router.route("/top-five-tours").get(aliasTopTours, getAllTours); // alias routing

// URL Form: /tours-within/233/center/40,-23/unit/mi
// Query String Form: /tours-within?distance=233&center=40,-23&unit=mi
router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(getToursWithin);

router.route("/distance/:latlng/unit/:unit").get(getTourDistances);

// exposing getAllTours as for api req from any site where api is integreated;
router
  .route("/")
  .get(getAllTours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);
router
  .route("/:id")
  .get(getTour)
  .patch(
    protect,
    restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

// POST Review: /tours/234329sde2/reivews
// GET All Review: /reivews
// GET Tour Reviews: /tours/234329sde2/reivews
// router
//   .route("/:tourId/reviews")
//   .post(protect, restrictTo("user"), createReview);

module.exports = router;
