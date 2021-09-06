const mongoose = require('mongoose')
const moment = require('moment')

const roundSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, required: false }, // The User that created the Round.
  calendars: [{ type: String }], // An Array of calendars this round belongs to.
  year: { type: Number, required: true }, // The year of the championship.
  championship: { type: String, required: true }, // The championship this Round is in.
  round: { type: Number, required: true }, // What round is this Round in the championship?
  track: { type: mongoose.Schema.ObjectId, required: false }, // The Track the relates to this Round.
  confirmed: { type: Boolean, required: true }, // Is this Round confirmed?
  from: { type: String, required: true }, // What date does this Round start?
  to: { type: String, required: true }, // What date does this round end?
  sessions: { type: String, required: false }, // What are the sessions and session date/times of the Round?
  likes: { type: Number, default: 0 }, // How many likes has this Round recieved?
  created_at: { type: String, default: moment().format() }, // When was this Round created?
  updated_at: { type: String, default: moment().format() }, // When was the last time this Round was created?
})

module.exports = mongoose.model('Round', roundSchema)