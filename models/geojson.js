const mongoose = require('mongoose')
const moment = require('moment')

const geojsonSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, required: false }, // The User that created the Geojson.
  post: { type: mongoose.Schema.ObjectId, required: false }, // The Post this Geojson is associated with.
  name: { type: String, required: true }, // The name of the Track.
  track: { type: mongoose.Schema.ObjectId, required: false }, // The Track associated with this Geojson.
  geojson: { type: String, required: true }, // The stingified Geojson.
  stats: { type: String, required: false }, // Geojson stats.
  created_at: { type: String, default: moment().format() }, // When the Geojson was created.
  updated_at: { type: String, default: moment().format() }, // The last time the Geojson was mutated.
})

module.exports = mongoose.model('Geojson', geojsonSchema)