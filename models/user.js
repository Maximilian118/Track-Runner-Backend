const mongoose = require('mongoose')
const moment = require('moment')

const userSchema = new mongoose.Schema({
	posts: [{ type: mongoose.Schema.ObjectId, ref: 'Post' }], // Array of posts the User has posted.
	tracks: [{ type: mongoose.Schema.ObjectId, ref: 'Track' }], // Array of tracks the User has created.
	geojsons: [{ type: mongoose.Schema.ObjectId, ref: 'Geojson' }], // Array of geojsons the User has created.
	following: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // Array of Users the User is following.
	events: [{ type: mongoose.Schema.ObjectId, ref: 'Event' }], // Array of Events the User has created or is participating in.
	calendars: [{ type: String }], // Calendars the User wishes to be displayed.
	champsCreated: [{ type: String }], // Championships the User has created.
	name: { type: String, required: true }, // User Name.
	email: { type: String, required: true }, // User Email.
	profile_picture: { type: String, required: false, default: "" }, // User Profile Picture.
	likes: { type: Number, default: 0 }, // A total of all the likes this User has received.
	password: { type: String, required: false, min: 8 }, // User encryptied password.
	refresh_count: { type: Number, default: 0 }, // Refresh count.
	logged_in_at: { type: String, default: null }, // Last logged in.
	created_at: { type: String, default: moment().format() }, // When the user signed up.
	updated_at: { type: String, default: moment().format() }, // Last user activity.
})

module.exports = mongoose.model('User', userSchema)