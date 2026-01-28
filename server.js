const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./.env" }); // in path ./ is the root directory

// uncaughtException are errors produced by synchronous codes that are not handled or caught
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require("./app");

const database = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

// console.log(process.env);
// mongoose previous options
//  {
// useNewUrlParser: true,
// useUnifiedTopology: true,
// useCreateIndex: true,
// useFindAndModify: false,
// }

mongoose.connect(database).then(() => {
  // console.log(connectionObj.connections);
  console.log("Database connection is successfull");
});
// .catch((err) => console.log(err.name + "--/ " + err.errmsg));

const port = 8000;
const server = app.listen(port, () => {
  console.log(`App is running on port:${port} 0__0`);
});

// any of the rejected promise if not handled will produce an event: unhandledRejection
// unhandled promise means that a promise was rejected from an async func but it has not been handled
process.on("unhandledRejection", (err) => {
  console.log(`${err.name}--/ ${err.message}`);
  console.log("UNHANDLED REJECTION 💥💥 SHUTTING DOWN...");

  // after setting up all requests (running or pending) the server is closed
  // without closing server and exiting the process abruptly shuts down the app
  server.close(() => {
    process.exit(1); // accepts 0 or 1; 0 stands for success and 1 for uncaught exception
  });
});
