const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
// const User = require("./usersModel");

// In Mongoose, a schema is used to define the structure of documents within a MongoDB collection.
// It specifies the fields, their data types, default values, and validation rules.
// Anything that is present in the posted request data-
// but not in the Schema will not be included in the database collection.
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name!"],
      unique: true,
      trim: true,
      maxLength: [45, "Tour name can not be greater than 45 characters long"],
      minLength: [10, "Tour name can not be less than 10 characters long"],
      validate: {
        validator: function (val) {
          return validator.isAlpha(val, ["en-US"], { ignore: " " });
        },
        message: "Name can not be other than ALPHA",
      },
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty level"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message:
          "Tour difficulty level should be either easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, "Ratings of tour should be equal or less than 5"],
      min: [1, "Ratings of tour should be greater than or equal 1"],
      // runs callback each time ratingsAverage is changed
      set: (val) => Math.round(val * 100) / 100,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price!"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // caviet: this only points to current doc on NEW document creation
          // arrow function doesn't work for this
          return val < this.price;
        },
        message: "Tour discount must be ({VALUE}) less than it's regular price",
        // {VALUE} for get the entered value
      },
    },
    summary: {
      type: String,
      trim: true, // trims white space at the beginning and ending of a stirng
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must a cover image"],
    },
    images: [String], // expexcts an [arr of image string]
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // prevents from exposing this field / better for sensitive data
    },
    startDates: [Date],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // id: false, // prevents sending additional id. Hence doc.id // undefined
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    /* Documents have a toObject method which converts the mongoose document into a plain
     JavaScript object. This method accepts a few options.
     Instead of applying these options on a per-document basis,
     we may declare the options at the schema level
     and have them applied to all of the schema's documents by default.*/
  }
);

// set index for query performance; 1=ascending, -1=descending
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// 2dsphere indexes support geospatial queries on an earth-like sphere
tourSchema.index({ startLocation: "2dsphere" }); // required for aggr $geoNear

// Adding Virtual fields to the Schema
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

/**
 * this in document middleware points to the document object
 * this in query middleware points to the query object
 * this in aggregate middleware points to the aggregate object and
 * this.pipeline() is the arr of stage objects.
 */

// Document Middleware
// ℹ️ runs only before .save() and .create() / not for insertMany() or create([])
// any of the middleware will be stuck if not called next()
// but doc will be saved even though
// this.slug = slugify(this.name, { replacement: "_", lower: true });

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre("insertMany", (next, docs) => {
//   docs.forEach((doc) => {
//     doc.slug = doc.name.toLowerCase().replace(/\s+/g, "-");
//   });
//   next();
// });

// tourSchema.pre("save", async function (next) {
//   // this.guides = await User.find({ _id: { $in: this.guides } }) // $in takes an arr
//   /** holds an arr of Query promises, generated from map */
//   const guidePromises = this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// tourSchema.pre("save", function (next) {
//   console.log("Doc will be saved!");
//   next();
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middleware
// tourSchema.pre("find", function (next) {
// using RegExp to match all find occurrance
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  console.log(`Resquest Took: ${Date.now() - this.start} milliseconds`);
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

// Aggregate Middleware
tourSchema.pre("aggregate", function (next) {
  const hasGeoNear = this.pipeline().find(
    (stage) => Object.keys(stage)[0] === "$geoNear"
  );
  if (!hasGeoNear) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }
  // console.log(this.pipeline());
  next();
});

// the model name and variable should be as convention in capitalize
// it's now like a class defination and it's instances will have access to methods
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

//
//

// testTour is an instance of the Tour schema model
// const testTour = new Tour({
//   name: "The Forest Hiker",
//   ratings: 4.7, price: 697,
// });

// after saving it will send the data to the database and send a a promise
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log("Error 💥💥: " + err);
//   });
