const mongoose = require('mongoose')
const moment = require('moment')

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, required: true }, // The User that created the Post.
  title: { type: String, required: true }, // The title of the Post.
  description: { type: String, required: false, default: "" }, // A description of the Post/run.
  track: { type: mongoose.Schema.ObjectId, required: false, default: null }, // A Track the relates to this Post. I.E. Which Track did the user run?
  geojson: { type: mongoose.Schema.ObjectId, required: false, default: null }, // A geojson of the run. Converted from a given GPX file.
  lap_time: { type: String, required: false }, // The fastest recorded lap time.
  distance: { type: Number, required: true }, // The total distance of the run. NOT the distance of one lap.
  runDT: { type: String, required: true }, // The date and time of the activity.
  imgs: [{ type: String }], // An array of image url strings associated with the Post.
  likes: { type: Number, default: 0 }, // How many likes has this Post received?
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }], // An Array of comments for this Post.
  created_at: { type: String, default: moment().format() }, // When was the Post created?
  updated_at: { type: String, default: moment().format() }, // When was the last time the Post was mutated?
})

module.exports = mongoose.model('Post', postSchema)