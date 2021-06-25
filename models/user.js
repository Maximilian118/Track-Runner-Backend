const mongoose = require('mongoose')
const moment = require('moment')

const userSchema = new mongoose.Schema({
	posts: [{ type: mongoose.Schema.ObjectId, ref: 'Post' }],
	following: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
	events: { type: Array, default: [] },
	logged_in_at: { type: String, default: null },
	created_at: { type: String, default: moment().format() },
	updated_at: { type: String, default: moment().format() },
	refresh_count: { type: Number, default: 0 },
	name: { type: String, required: true },
	email: { type: String, required: true },
	profile_picture: { type: String, required: false, default: "" },
	password: { type: String, required: false, min: 8 },
})

module.exports = mongoose.model('User', userSchema)