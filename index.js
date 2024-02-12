require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const userSchema = new mongoose.Schema({
  username: String,
});
const exerciseSchema = new mongoose.Schema({
  username: String,
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});
const logSchema = new mongoose.Schema({
  username: String,
  userId: String,
  count: Number,
  log: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
const Log = mongoose.model("Log", logSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const user = new User({ username: username });

  await user.save().then(() => {
    res.json({ username: user.username, _id: user._id });
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;
  const username = await User.findById(userId).then((user) => {
    return user.username;
  });

  if (date === "") {
    date = new Date();
  }

  const exercise = new Exercise({
    username: username,
    description: description,
    duration: duration,
    date: date,
    userId: userId,
  });

  exercise.save().then(() => {
    res.json({
      username: username,
      description: description,
      duration: duration,
      date: date.toDateString(),
      _id: userId,
    });
  });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const username = await User.findById(userId).then((user) => {
    return user.username;
  });
  const count = await Exercise.find({ userId: userId }).countDocuments();

  const log = await Exercise.find({ userId: userId }).then((exercises) => {
    return exercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: Number(exercise.duration),
        date: exercise.date.toDateString(),
      };
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
