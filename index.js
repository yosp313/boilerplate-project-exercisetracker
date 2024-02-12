require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB"));

const userSchema = new mongoose.Schema({
  username: String,
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

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

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
  const date = req.body.date;

  const user = await User.findById(userId);

  const exerciseObj = new Exercise({
    userId: userId,
    description: description,
    duration: duration,
    date: date ? new Date(date) : new Date(),
  });

  const exercise = await exerciseObj.save().catch((err) => {
    console.log(err);
  });

  res.json({
    _id: userId,
    username: user.username,
    date: new Date(exercise.date).toDateString(),
    duration: exercise.duration,
    description: exercise.description,
  });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const user = await User.findById(userId);
  const { from, to, limit } = req.query;

  const exercise = await Exercise.find({ userId: userId });

  let logs = exercise.map((e) => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString(),
  }));

  const count = logs.length;

  if (from) {
    logs = logs.filter((e) => new Date(e.date) >= new Date(from));
  }
  if (to) {
    logs = logs.filter((e) => new Date(e.date) <= new Date(to));
  }
  if (limit) {
    logs = logs.slice(0, limit);
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: count,
    log: logs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
