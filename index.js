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
app.use("/api/exercise/log", (req, res, next) => {
  if (!req.query.userId) {
    return res.json({
      error: "userId is required!",
    });
  } else {
    return next();
  }
});

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
app.get("/api/exercise/users", async (req, res) => {
  allUsers = await User.find({}, "username _id");
  res.json(allUsers);
});

// Exercise log route
app.get("/api/exercise/log", async (req, res) => {
  let user = await User.findOne({ _id: req.query.userId }, "username").lean();
  let responseLog = await Exercise.find(
    { userId: req.query.userId },
    "description duration date"
  ).exec();

  user.log = responseLog;

  res.json(user);
});

// Create user route
app.post("/api/exercise/new-user", (req, res) => {
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

app.post("/api/exercise/add", async (req, res) => {
  let user = await User.findOne({ _id: req.body.userId }).exec();
  // console.log(user);

  let exerciseRecord = {
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
  };

  // res.json(exerciseRecord);

  // Create the record of the exercise
  Exercise.create(exerciseRecord, (err) => {
    if (err) {
      return res.json({
        error: err,
      });
    } else {
      exerciseRecord.username = user.username;
      return res.json(exerciseRecord);
    }
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
