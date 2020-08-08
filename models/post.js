const mongoose = require('mongoose')
const moment = require('moment')

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  img: { type: String, required: false },
  author: { type: String, required: true },
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }],
  created_at: { type: String, default: moment().format() },
  updated_at: { type: String, default: moment().format() },
})

module.exports = mongoose.model('Post', postSchema)