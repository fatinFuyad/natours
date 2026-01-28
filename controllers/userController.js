const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/usersModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     // works like milldeware
//     callback(null, "public/img/users"); // err first callback
//   },
//   filename: (req, file, callback) => {
//     const extension = file.mimetype.split("/")[1]; // as for: image/jpeg
//     // callback(null, `user-${req.user._id}.${extension}`); // same filename will overrite previous one
//     callback(null, `user-${req.user._id}-${Date.now()}.${extension}`);
//   },
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith("image")) {
    callback(null, true);
  } else {
    callback(
      new AppError("Not an image! Please upload only image file.", 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.updateUserPhoto = upload.single("photo");
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  req.file.filename = filename; // we pass filename as it will be read later;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${filename}`);

  next();
});

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// getMe is a middleware used to add the user _id to params;
// which is needed in factory.getOne() for finding specific user;

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. Please go to /updateMyPassword",
        400
      )
    );

  // 2) Update user document
  // all validators run by default, only on .create() and .save()
  // only the validators related to the fields we pass to .findByIdAndUpdate run, and only when we specify runValidators: true
  //⚠️ Don't allow all fields coming from req.body as anyone can modify role to admin or any other fields

  // Filter out unwanted field names that are not allowed to be updated
  const filteredBody = filteredObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename; // req.body doesn't contain file

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true, // for returning updated user
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res) => {
  // The General Data Protection Regulation (GDPR) aims to enhance individuals' control over their personal data and unify data protection laws.
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "Internal Server Error!💥💥",
    message: "This route is not defined! Please use /signup",
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// passwords shouldn't be updated by this method
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
