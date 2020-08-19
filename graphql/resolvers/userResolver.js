const bcrypt = require("bcryptjs")
const moment = require("moment")

const User = require("../../models/user")
const Post = require("../../models/post")

const { 
  userPopulationObj,
  emptyS3Directory,
  signTokens,
} = require('../../shared/utility')

module.exports = {
  createUser: async args => {
    try {
      const {name, email, password, pass_confirm} = args.userInput

      if (!name) {
        throw new Error("Please enter your name. Feel free to make one up!")
      } else if (!/^[a-zA-Z\s-']{1,30}$/.test(name)) {
        throw new Error("Your name cannot contain numbers or special characters other than hyphens and apostrophes.")
      }

      if (!email) {
        throw new Error("Please enter an email address.")
      } else if (await User.findOne({email})) {
        throw new Error("A User by that email already exists!")
      } else if (!/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)) {
        throw new Error("Please enter a valid email address.")
      }

      if (!password) {
        throw new Error("Please enter a password.")
      } else if (!/^(?=.*\d)(?=.*[a-zA-Z])(?!.*\s).{8,20}$/.test(password)) {
        throw new Error("Your password must have at least one letter and one number. Minimum 8 characters.")
      }

      if (!pass_confirm) {
        throw new Error("Please enter your password confirmation.")
      } else if (password !== pass_confirm) {
        throw new Error("Passwords do not match.")
      }

      const user = new User(
        {
          name,
          email,
          password: await bcrypt.hash(password, 12),
          created_at: moment().format(),
          updated_at: moment().format(),
          logged_in_at: moment().format(),
        },
        err => {
          if (err) throw new Error(err)
        }
      )
  
      await user.save()

      return {
        ...user._doc,
        tokens: JSON.stringify(signTokens(user)),
        password: null,
      }
    } catch (err) {
      throw err
    }
  },
  login: async ({email, password}) => {
    try {
      const user = await User.findOne({email}).populate(userPopulationObj)
      if (!user) throw new Error("An account by that email was not found!")

      if (!password) {
        throw new Error("Please enter your password.") 
      } else if (!bcrypt.compareSync(password, user.password)) {
        throw new Error("Incorrect password.")
      }

      user.logged_in_at = moment().format()
      await user.save()

      return {
        ...user._doc,
        tokens: JSON.stringify(signTokens(user)),
        password: null,
      }
    } catch (err) {
      throw err
    }
  },
  user: async ({_id}, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findOne({_id}).populate(userPopulationObj)
      if (!user) throw new Error("A User by that ID was not found!")

      return {
        ...user._doc,
        tokens: req.tokens,
        password: null,
      }
    } catch (err) {
      throw err
    }
  },
  deleteUser: async ({}, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findOne(req._id).populate(userPopulationObj)
      if (!user) throw new Error("A User by that ID was not found!")

      await user.posts.forEach(async post => {
        await post.comments.forEach(async comment => {
          await Comment.deleteOne({ _id: comment._id })
        })
        await Post.deleteOne({ _id: post._id })
      })

      await User.deleteOne({ _id: req._id })

      await emptyS3Directory(process.env.AWS_BUCKET, `${req._id}/`)

      return {
        ...user._doc,
      }
    } catch (err) {
      throw err
    }
  },
}
