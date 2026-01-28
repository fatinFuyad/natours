const express = require("express");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
// const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const tourRouter = require("./routes/tourRouter");
const userRouter = require("./routes/userRouter");
const reviewRouter = require("./routes/reviewRouter");
const viewRouter = require("./routes/viewRouter");
const bookingRouter = require("./routes/bookingRouter");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// 1) MIDDLEWARES
const app = express();

// set the view engine to pug
app.set("view engine", "pug");
// set the directory where the template files are located
app.set("views", path.join(__dirname, "views"));

// serve static files
app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static(`${__dirname}/public`));

// app.use(helmet({ contentSecurityPolicy: false }));// problem with cors policy

// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// limit requests from same IP
const limiter = rateLimit({
  max: 100, // allowed max req
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP! Please try again later in an hour.",
});

app.use("/api", limiter); // the route specified will be applied on;

// body parser, reads data from body and parses req.query
app.use(express.json({ limit: "10kb" })); // Controls the maximum request body size
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // parses incoming requests with urlencoded payloads like form data which is sent as urlencoded
app.use(cookieParser()); // parses cookie from req.cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "price",
      "ratingsAverage",
      "ratingsQuantity",
      "duration",
      "maxGroupSize",
      "difficulty",
    ],
  }),
);

app.use(compression()); // compress response texts
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   // console.log(req.cookies);
//   next();
// });

// Mounted ROUTING
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `Can't find requested url: ${req.originalUrl} 💥`,
  // });

  // const err = new Error(
  //   `Can't find requested url: ${req.originalUrl} on the server 💥💥`,
  // );

  // err.statusCode = 404;
  // err.status = "fail";
  // next();

  /** when passing arg in next, epress will assume an err has occurred and pass the err
   * to the global err handling middleware,surpassing all other middlewares from the
   * stack
   */
  const message = `Can't find requested url: ${req.originalUrl} on the server 💥💥`;
  const statusCode = 404;

  next(new AppError(message, statusCode));
});

app.use(globalErrorHandler);

module.exports = app;

/**
 * The req.query property is no longer a writable property and is instead a getter.
 * The default query parser has been changed from “extended” to “simple”.
 * app.set('query parser', extended")
 * For aliasRouting modify the req.url and that will be reflected on the req.query
 * when two response is sent at the same time ⬇️
 * Error [ERR_HTTP_HEADERS_SENT]:Cannot set headers after they are sent to the client ❌
 */

/**
 * express.json() is used to handle and parse incoming JSON data.
 * This middleware is essential for working with JSON payloads in requests, such as those sent via POST, PUT, or PATCH methods.
 * Without it, Express cannot automatically parse JSON data, and the req.body will remain undefined.
 */

/**
  app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  })
);
 */

// req object contains the url properties
/*
express deprecated req.host: Use req.hostname instead app.js:80:15
{
  url: '/my-bookings/tours/949?tour=the-northern-lights&user=fatin&price[lte]=1500',
  originalUrl: '/my-bookings/tours/949?tour=the-northern-lights&user=fatin&price[lte]=1500',
  path: '/my-bookings/tours/949',
  protocol: 'http',
  host: '127.0.0.1',
  hostname: '127.0.0.1',
  // req.get('host'): '127.0.0.1:8000',
  // no port property in req object available
  param: {},
  query: {
    tour: 'the-northern-lights',
    user: 'fatin',
    price: { lte: '1500' }
  }
}
*/
