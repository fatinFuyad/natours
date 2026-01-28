const express = require("express");
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require("../controllers/reviewController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router({ mergeParams: true }); // Preserves params from parent router

// before creating review, user needs to be authenticated and
// this action is only limited to users and admin.
// tour guides are not allowed to perform any action for review

router.use(protect); // PROTECT all reviews routes from public interruption
router
  .route("/")
  .get(getAllReviews)
  .post(restrictTo("user", "admin"), setTourUserIds, createReview);

router
  .route("/:id")
  .get(getReview)
  .patch(updateReview)
  .delete(restrictTo("user", "admin"), deleteReview);

module.exports = router;
