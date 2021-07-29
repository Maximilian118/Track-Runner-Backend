const mongoose = require('mongoose')
const moment = require('moment')

const postSchema = new mongoose.Schema({
  user: { type: String, required: true }, // The User that created the Post.
  title: { type: String, required: true }, // The title of the Post.
  description: { type: String, required: false }, // The description of the Post.
  img: { type: String, required: false }, // An image url associated with the Post.
  likes: { type: Number, default: 0 }, // How many likes has this Post received?
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }], // An Array of comments for this Post.
  created_at: { type: String, default: moment().format() }, // When was the Post created?
  updated_at: { type: String, default: moment().format() }, // When was the last time the Post was mutated?
})

module.exports = mongoose.model('Post', postSchema)