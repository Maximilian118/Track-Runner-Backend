const moment = require("moment")

const User = require("../../models/user")
const Post = require("../../models/post")
const Track = require ("../../models/track")
const Geojson = require("../../models/geojson")

const { GPXtoGeojson } = require("../../shared/utility")

const {
  userPopulation,
  trackPopulation,
} = require("../../shared/population")

module.exports = {
  createTrack: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const { user_id, post_id, name, country, location, logo, geojson, gpx, stats } = args.trackInput

      const user = await User.findById(user_id).populate(userPopulation)
      if (user_id && !user) throw new Error("A User by that ID was not found!")

      const post = await Post.findById(post_id)
      if (post_id && !post) throw new Error("A Post by that ID was not found!")

      const trackTest = await Track.findOne({name})
      if (trackTest) throw new Error("A Track by that name already exists!")

      let newGeojson = null

      if (!geojson && gpx) {
        const geoData = GPXtoGeojson(gpx)
        newGeojson = new Geojson(
          {
            user: user ? user._id : null,
            post: post ? post._id : null,
            name,
            geojson: JSON.stringify(geoData.geojson),
            stats: JSON.stringify({
              coords: geoData.coords,
              distance: geoData.distance,
              elevation: geoData.elevation,
              slopes: geoData.slopes,
            }),
          },
          err => {
            if (err) throw new Error(err)
          }
        ) 
      }

      const newTrack = new Track(
        {
          user: user ? user._id : null,
          post: post ? post._id : null,
          name,
          country,
          location,
          logo: logo ? logo : null,
          geojson: geojson ? geojson : newGeojson ? newGeojson._id : null,
          stats: stats ? stats : null,
        },
        err => {
          if (err) throw new Error(err)
        }
      )

      if (newGeojson) {
        newGeojson.track = newTrack._id
        await newGeojson.save()
      }

      await newTrack.save()

      if (geojson) {
        const geo = await Geojson.findById(geojson)
        newGeojson = geo
        geo.track = newTrack._id
        await geo.save()
      }

      if (user) {
        newGeojson && gpx && user.geojsons.push(newGeojson._id)
        user.tracks.push(newTrack._id)
        user.updated_at = moment().format()
        await user.save()

        console.log(`${user.email} created a new Track: ${newTrack.name}.`)
      } else {
        console.log(`New track: ${newTrack.name}.`)
      }

      return {
        ...newTrack._doc,
        geojson: newGeojson ? newGeojson._doc : null,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  track: async ({ user_id, post_id, track_id, name }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      let track = null
      
      if (name) {
        track = await Track.findOne({name}).populate(trackPopulation)
      } else if (user_id || post_id || track_id) {
        track = await Track.findById({ user: user_id, post: post_id, _id: track_id}).populate(trackPopulation)
      }

      if (track) {
        return {
          ...track._doc,
          tokens: req.tokens,
        }
      } else {
        return {
          tracks: track === null && JSON.stringify(await Track.find()),
          tokens: req.tokens,
        }
      }
    } catch (err) {
      throw err
    }
  },
  updateTrackLogo: async ({ track_id, name, logo }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      let track = null
      
      if (name) {
        track = await Track.findOne({name}).populate(trackPopulation)
      } else {
        track = await Track.findById({ _id: track_id}).populate(trackPopulation)
      }

      if (!track) throw new Error("A track was not found!")

      track.logo = logo
      track.updated_at = moment().format()
      track.save()

      return {
        ...track._doc,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
}