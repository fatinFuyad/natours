const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// const getCollectionName = (Model) => Model.modelName.toLowerCase();

exports.deleteOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id); // deleted doc is returned

    if (!doc) {
      return next(
        new AppError(
          `Invalid ID or the ${Model.modelName.toLowerCase()} is not found`,
          404
        )
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // this validators run from schema while updating
    });
    const modelName = Model.modelName.toLowerCase();
    if (!doc) {
      return next(
        new AppError(
          `Invalid ID or the ${Model.modelName.toLowerCase()} is not found`,
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        [modelName]: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body); // it will return a promise
    const modelName = Model.modelName.toLowerCase();

    if (!doc) {
      return next(new AppError(`Invalid ID or the ${modelName} is not found`, 404));
    }
    res.status(200).json({
      status: "success",
      data: { [modelName]: doc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;
    const modelName = Model.modelName.toLowerCase();
    if (!doc) {
      // it's important to return otherwise below response will be delivered
      return next(new AppError(`Invalid ID or the ${modelName} is not found`, 404));
    }
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      data: { [modelName]: doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    // to allow for nested GET reviews on Tour (hack) ✅
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Model.find() will create query object onto that we can call methods
    const queryFeature = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await queryFeature.query; //.explain() /to get all kinds query details
    const collectionName = Model.collection.name;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: { [collectionName]: docs },
    });
  });
