// eslint-disable-next-line
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");

const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A user must have a name"],
      minLength: [2, "Username should be more or atleast 2 characters"],
      maxLength: [35, "Username should be less than or equal 35 characters"],
    },
    email: {
      type: String,
      required: [true, "User must have an email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    photo: {
      type: String,
      default: "default.jpg",
    },

    role: {
      // all created user's role will be default user/ to modify role set it from database
      type: String,
      enum: ["user", "guide", "lead-guide", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "User should "],
      minLength: [8, "Password should be at least 8 characters long"],
      maxLength: [24, "Password should be less than 24 characters"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        // it only works for methods create() and save() // not on update
        validator: function (el) {
          return el === this.password; // only returns true or false for validation
        },
        message: "Passwords are not the same~!",
      },
    },
    passwordChangedAt: Date,
    passwordResetExpires: Date,
    passwordResetToken: String,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  }
  // { id: false }
);

// Encrypting passwords with bcrypt
usersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only runs while password is changed
  this.password = await bcrypt.hash(this.password, 12); // values: 8 10 12 16

  // delete passwordConfirm field as it's not necessary to save in database;
  this.passwordConfirm = undefined;
  next();
});

usersSchema.pre("save", function (next) {
  // when new user is created isModified() is true and isNew is true
  // but when isModified() is true and isNew is false
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // sometimes tokens are bit delayed while saved

  next();
});

usersSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); // filter out inactive user
  next();
});

// include an instance method that will be available to all of the documents
usersSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  // this refers to the current doc. but as password field is select false,
  // hence we can't retrieve the value of this.password. actually we could as we later have select("+password")
  //returns true or false
  return await bcrypt.compare(candidatePassword, userPassword);
};

usersSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      new Date(this.passwordChangedAt).getTime() / 1000,
      10
    );
    // console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp; // checks if password was changed after the token had already provided
  }
  return false;
};

usersSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", usersSchema);

module.exports = User;
