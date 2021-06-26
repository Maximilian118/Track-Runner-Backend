const mongoose = require('mongoose')
const moment = require('moment')

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  location: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: false },
  img: { type: String, required: false },
  author: { type: String, required: true },
  participants: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  created_at: { type: String, default: moment().format() },
  updated_at: { type: String, default: moment().format() },
})

module.exports = mongoose.model('Event', eventSchema)