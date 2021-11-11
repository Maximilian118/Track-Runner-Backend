const mongoose = require('mongoose')
const moment = require('moment')

const trackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, required: false }, // The User that created the Track.
  post: { type: mongoose.Schema.ObjectId, required: false }, // the Post this Track was created for.
  name: { type: String, required: true }, // The name of the Track.
  country: { type: String, required: true }, // The country the Track is in.
  location: { type: String, required: true }, // The location of the Track in that country.
  logo: { type: String, required: false }, // Track logo img url.
  geojson: { type: mongoose.Schema.ObjectId, required: false }, // stringified geojson of the Track.
  stats: { type: String, required: false }, // Track stats.
  likes: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // Likes the Track has recieved.
  created_at: { type: String, default: moment().format() }, // When the Track was created.
  updated_at: { type: String, default: moment().format() }, // Last time the Track was updated.
})

module.exports = mongoose.model('Track', trackSchema)