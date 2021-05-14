// Exercise tracker for FCC
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { response } = require("express");

// Init the app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({ optionsSuccessStatus: 200 }));

// Enable Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Check request params for log route
// app.use("/api/exercise/log", (req, res, next) => {
//   if (!req.query.userId) {
//     return res.json({
//       error: "userId is required!",
//     });
//   } else {
//     return next();
//   }
// });

// Connect to DB
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => {
    console.log("connected to DB!");
  }
);

// DB Schemas
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  created_on: {
    type: Date,
    default: Date.now(),
  },
});

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: Date,
});

// Models
const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
  res.json({
    message: "Hello There",
  });
});

// All users route
app.get("/api/users", async (req, res) => {
  allUsers = await User.find({}, "username _id");
  res.json(allUsers);
});

// Exercise log route
app.get("/api/users/:_id/logs", async (req, res) => {
  // Query parameters
  let from = req.query.from ? new Date(req.query.from) : req.query.from;
  let to = req.query.to ? new Date(req.query.to) : req.query.to;
  let limit = parseInt(req.query.limit);

  let responseLog;
  let user;

  try {
    user = await User.findOne({ _id: req.params._id }, "username").lean();
  } catch (err) {
    return res.json({
      error: err,
      message: "User id does not exist",
    });
  }

  try {
    if (from && to) {
      responseLog = await Exercise.find(
        { userId: req.params._id, date: { $gte: from, $lte: to } },
        "description duration date"
      ).limit(limit);
    } else if (from) {
      responseLog = await Exercise.find(
        { userId: req.params._id, date: { $gte: from } },
        "description duration date"
      ).limit(limit);
    } else if (to) {
      responseLog = await Exercise.find(
        { userId: req.params._id, date: { $lte: to } },
        "description duration date"
      ).limit(limit);
    } else {
      responseLog = await Exercise.find(
        { userId: req.params._id },
        "description duration date"
      ).limit(limit);
    }
  } catch (err) {
    return res.json({
      error: err,
    });
  }

  user.log = responseLog;
  user.count = responseLog.length;

  res.json(user);
});

// Create user route
app.post("/api/users", (req, res) => {
  const username = req.body.username;

  // Create record
  User.create(
    {
      username: username,
    },
    (err, user) => {
      if (err) {
        return res.json({
          error: err,
        });
      } else {
        res.json({
          username: user.username,
          _id: user._id,
        });
      }
    }
  );
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let user = await User.findOne({ _id: req.params._id }, "username _id").lean();

  // console.log(req.body);

  let exerciseRecord = {
    userId: user._id,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
  };

  user.description = exerciseRecord.description;
  user.duration = exerciseRecord.duration;
  user.date = exerciseRecord.date;

  // res.json(exerciseRecord);

  // Create the record of the exercise
  Exercise.create(exerciseRecord, (err) => {
    if (err) {
      return res.json({
        error: err,
      });
    } else {
      // console.log(user);
      return res.json(user);
    }
  });
});

// Delete all user records
app.delete("/api/users/delete", (req, res) => {
  User.deleteMany({}).exec();
  Exercise.deleteMany({}).exec();
  res.json({
    message: "All records deleted!",
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
