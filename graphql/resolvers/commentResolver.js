const User = require("../../models/user")
const Post = require("../../models/post")
const Comment = require("../../models/comment")

module.exports = {
  createComment: async ({ post_id, comment }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findById(req._id)
      if (!user) throw new Error("A User by that ID was not found!")

      const post = await Post.findById(post_id)
      if (!post) throw new Error("A Post by that ID was not found!")

      const newComment = new Comment(
        {
          user: user._id,
          post: post_id,
          comment,
        },
        err => {
          if (err) throw new Error(err)
        }
      )

      await newComment.save()

      post.comments.push(newComment._id)
      await post.save()

      return {
        ...newComment._doc,
        user,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
}