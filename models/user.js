const mongoose = require('mongoose')
const moment = require('moment')

const userSchema = new mongoose.Schema({
	posts: [{ type: mongoose.Schema.ObjectId, ref: 'Post' }], // Array of posts the User has posted.
	tracks: [{ type: mongoose.Schema.ObjectId, ref: 'Track' }], // Array of tracks the User has created.
	geojsons: [{ type: mongoose.Schema.ObjectId, ref: 'Geojson' }], // Array of geojsons the User has created.
	following: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // Array of Users the User is following.
	events: [{ type: mongoose.Schema.ObjectId, ref: 'Event' }], // Array of Events the User has created or is participating in.
	rounds: [{ type: mongoose.Schema.ObjectId, ref: 'Round' }], // Array of Rounds the user has created.
	calendars: [{ type: String }], // Array of Calendars the User wishes to be displayed.
	championships: [{ type: String }], // Array of Championships the User has created.
	coords: [], // Array. Coordinates of the user. [0] === lng, [1] === lat.
	name: { type: String, required: true }, // User Name.
	email: { type: String, required: true }, // User Email.
	icon: { type: String, required: false, default: "" }, // User Icon. Same image as Profile Picture but compressed to aprox 0.05mb.
	profile_picture: { type: String, required: false, default: "" }, // User Profile Picture. Compressed to aprox 0.5mb.
	likes: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // A total of all the likes this User has received.
	password: { type: String, required: false, min: 8 }, // User encryptied password.
	refresh_count: { type: Number, default: 0 }, // Refresh count.
	logged_in_at: { type: String, default: null }, // Last logged in.
	created_at: { type: String, default: moment().format() }, // When the user signed up.
	updated_at: { type: String, default: moment().format() }, // Last user activity.
})

module.exports = mongoose.model('User', userSchema)