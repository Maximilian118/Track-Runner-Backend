const mongoose = require('mongoose')
const moment = require('moment')

const eventSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.ObjectId, required: true }, // The User that crated the Event.
  title: { type: String, required: true }, // The title of the Event.
  description: { type: String, required: false }, // A description of the Event.
  location: { type: String, required: true }, // The location of the Event.
  startDate: { type: String, required: true }, // The start date & time of the Event.
  endDate: { type: String, required: false }, // The end date & time of the Event.
  img: { type: String, required: false }, // An image url associated with the event.
  likes: { type: Number, default: 0 }, // The likes this Event has recieved?
  participants: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // An Array of Users participating in the Event.
  created_at: { type: String, default: moment().format() }, // When the Event was created.
  updated_at: { type: String, default: moment().format() }, // When the Event was updated.
})

module.exports = mongoose.model('Event', eventSchema)