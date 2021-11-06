const User = require("../../models/user")
const Post = require("../../models/post")

const {
  feedUserPopulation,
  postPopulation,
} = require("../../shared/population")

module.exports = {
  feed: async ({ fromDate, toDate, amount }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findById(req._id).populate(feedUserPopulation)
      if (!user) throw new Error("A User by that ID was not found!")

      const args = toDate ? { $lte: fromDate, $gt: toDate } : { $lte: fromDate } 
      const feed = await Post.find({ created_at: args}).limit(amount).populate(postPopulation)
      if (feed.length === 0 && !toDate) throw new Error("No Posts were found! Picnic! (╯°□°)╯︵ ┻━┻")

      return {
        feed: JSON.stringify(feed.reverse()),
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
}