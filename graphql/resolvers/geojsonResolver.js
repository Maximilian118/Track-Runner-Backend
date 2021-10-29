const moment = require("moment")

const User = require("../../models/user")
const Geojson = require("../../models/geojson")

const { GPXtoGeojson } = require("../../shared/utility")

module.exports = {
  createGeojson: async ({ gpx, filename }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findById(req._id)
      if (!user) throw new Error("A User by that ID was not found!")

      const geoData = GPXtoGeojson(gpx)

      const geojson = new Geojson(
        {
          user: user ? user._id : null,
          post: null, // If req made on Post page, on createPost, update this.
          track: null, // Not attached to a Track on a Round of a calendar.
          name: filename,
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

      await geojson.save()

      user.geojsons.push(geojson._id)
      user.updated_at = moment().format()
      await user.save()

      return {
        ...geojson._doc,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
}