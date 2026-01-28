const mongoose = require("mongoose");
const Tour = require("./toursModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      // min: 1,
      // max: 5,
      validate: {
        validator: (val) => val <= 5 && val >= 1,
        message: "Ratings should be between 1 and 5 i.e 1<= rating >= 5",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour!"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user!"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// set compound index to prevent users from giving multiple reviews to a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// All of the methods set to the Schema, will be available to the Model;
// we can only use static inside a class, and then attach that class to the schema using userSchema.loadClass(ClassName).

// schema.statics works on the Model (Class level)
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        numRatings: { $sum: 1 },
        avgRatings: { $avg: "$rating" },
      },
    },
    // {
    //   $addFields: {
    //     avgRatings: {
    //       $round: ["$avgRatings", 2],
    //     },
    //   },
    // },
  ]);

  // console.log(stats);
  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRatings,
      ratingsQuantity: stats[0].numRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post("save", async function () {
  // this - points to the currently created doc / but constructor is the Model
  await this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "tour",
  //   select: "name price ratingsAverage",
  // })
  this.populate({
    path: "user",
    select: "name photo", // ⚠️ don't leat any private data like: email, password etc
  });
  next();
});

// ⚠️ Mongoose no longer allows executing the same query object twice.
// If you do, you'll get a Query was already executed error.
// Executing the same query instance twice is typically indicative of mixing callbacks and promises, but if you need to execute the same query twice,
// you can call Query.clone() to clone the query and re-execute it.

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

// ℹ️ query middleware post also gets access to the currently saved or modified document
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
