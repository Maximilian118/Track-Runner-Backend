const moment = require("moment")

const User = require("../../models/user")
const Post = require("../../models/post")
const Geojson = require("../../models/geojson")

const { postPopulation } = require("../../shared/population")

module.exports = {
  createPost: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const { title, description, track, geojson, lapTime, distance, runDT, imgs } = args.postInput
      
      const user = await User.findById(req._id)
      if (!user) throw new Error("A User by that ID was not found!")

      let post = new Post(
        {
          user: user._id,
          title,
          description: description ? description : null,
          track: track ? track : null,
          geojson: geojson ? geojson : null,
          lap_time: lapTime ? lapTime : null,
          distance: Number(distance),
          runDT,
          imgs: imgs ? JSON.parse(imgs) : null,
        },
        err => {
          if (err) throw new Error(err)
        }
      )

      await post.save()

      if (geojson) {
        const geo = await Geojson.findById(geojson)
        geo.post = post._id
        await geo.save()
      }

      user.posts.push(post._id)
      user.updated_at = moment().format()
      await user.save()

      const newPost = await Post.findById(post._id).populate(postPopulation)

      return {
        ...newPost._doc,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
}