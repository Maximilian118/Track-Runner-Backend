const mongoose = require('mongoose')
const moment = require('moment')

const commentSchema = new mongoose.Schema({
  user: { type: String, required: true }, // The User that made the comment.
  post: { type: String, required: true }, // The Post this comment is associated with.
  comment: { type: String, required: true }, // The comment string.
  likes: { type: Number, default: 0 }, // The likes this comment has recieved.
  created_at: { type: String, default: moment().format() }, // When the comment was created.
	updated_at: { type: String, default: moment().format() }, // When the comment was updated.
})

module.exports = mongoose.model('Comment', commentSchema)