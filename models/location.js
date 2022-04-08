const mongoose = require('mongoose')
const moment = require('moment')

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true, default: null }, // latitude of the user.
  longitude: { type: Number, required: true, default: null }, // longitude of the user.
  type: { type: String, required: false, default: null },
  distance: { type: Number, required: false, default: null },
  name: { type: String, required: false, default: null },
  number: { type: String, required: false, default: null },
  postal_code: { type: String, required: false, default: null },
  street: { type: String, required: false, default: null },
  confidence: { type: Number, required: false, default: null },
  region: { type: String, required: false, default: null },
  region_code: { type: String, required: false, default: null },
  county: { type: String, required: false, default: null },
  locality: { type: String, required: false, default: null },
  administrative_area: { type: String, required: false, default: null },
  neighbourhood: { type: String, required: false, default: null },
  country: { type: String, required: false, default: null },
  country_code: { type: String, required: false, default: null },
  continent: { type: String, required: false, default: null },
  label: { type: String, required: false, default: null },
  geojson: { type: Object, required: false, default: null },
  created_at: { type: String, default: moment().format() }, // When location data was created.
  updated_at: { type: String, default: moment().format() }, // The last time location was mutated.
})

module.exports = mongoose.model('Location', locationSchema)