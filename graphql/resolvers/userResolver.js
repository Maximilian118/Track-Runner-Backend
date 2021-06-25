const bcrypt = require("bcryptjs")
const moment = require("moment")
const nodemailer = require('nodemailer')
const generator = require('generate-password')

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
      const { name, email, password, pass_confirm } = args.userInput

      if (!name) {
        throw new Error(JSON.stringify({
          type: "name",
          message: "Please enter your name. Feel free to make one up!",
        }))
      } else if (!/^[a-zA-Z\s-']{1,30}$/.test(name)) {
        throw new Error(Error(JSON.stringify({
          type: "name",
          message: "Your name cannot contain numbers or special characters other than hyphens and apostrophes.",
        })))
      }

      if (!email) {
        throw new Error("Please enter an email address.")
      } else if (await User.findOne({email})) {
        throw new Error(JSON.stringify({
          type: "email",
          message: "A User by that email already exists!",
        }))
      } else if (!/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)) {
        throw new Error(JSON.stringify({
          type: "email",
          message: "Please enter a valid email address.",
        }))
      }

      if (!password) {
        throw new Error(JSON.stringify({
          type: "password",
          message: "Please enter a password.",
        }))
      } else if (!/^(?=.*\d)(?=.*[a-zA-Z])(?!.*\s).{8,20}$/.test(password)) {
        throw new Error(JSON.stringify({
          type: "password",
          message: "Your password must have at least one letter and one number. Minimum 8 characters.",
        }))
      }

      if (!pass_confirm) {
        throw new Error(JSON.stringify({
          type: "passConfirm",
          message: "Please enter your password confirmation.",
        }))
      } else if (password !== pass_confirm) {
        throw new Error(JSON.stringify({
          type: "passConfirm",
          message: "Passwords do not match.",
        }))
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
      console.log(`${name} created an account.`)

      return {
        ...user._doc,
        tokens: JSON.stringify(signTokens(user)),
        password: null,
      }
    } catch (err) {
      throw err
    }
  },
  login: async ({ email, password }) => {
    try {
      const user = await User.findOne({email}).populate(userPopulationObj)
      if (!user) throw new Error(JSON.stringify({
        type: "email",
        message: "An account by that email was not found!",
      }))

      if (!password) {
        throw new Error(JSON.stringify({
          type: "password",
          message: "Please enter your password.",
        })) 
      } else if (!bcrypt.compareSync(password, user.password)) {
        throw new Error(JSON.stringify({
          type: "password",
          message: "Incorrect password.",
        }))
      }

      user.logged_in_at = moment().format()
      await user.save()
      console.log(`${email} logged in.`)

      return {
        ...user._doc,
        tokens: JSON.stringify(signTokens(user)),
        password: null,
      }
    } catch (err) {
      throw err
    }
  },
  user: async ({ _id }, req) => {
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
  forgot: async ({ email }) => {
    try {
      const user = await User.findOne({email}).populate(userPopulationObj)
      if (!user) throw new Error(JSON.stringify({
        type: "email",
        message: "An account by that email was not found!",
      }))

      const randomPass = generator.generate({
        length: 10,
        numbers: true,
      })

      const transport = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASS,
        }
      }
      
      const transporter = nodemailer.createTransport(transport)
      transporter.verify((err, res) => {
        if (err) throw new Error("Could not verify Nodemailer transporter")
      })
      
      const mail = {
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: "Track-Runner Password Reset",
        text: `
        From:
        Track-Runner
    
        Message: 
        Your password has is now ${randomPass}. 
        If you did not expect this email contact maxcrosby118@gmail.com immediately.
        `
      }

      user.password = await bcrypt.hash(randomPass, 12)
      user.save()

      transporter.sendMail(mail, (err, data) => {
        if (err) {
          throw new Error(err)
        } else {
          console.log(`${email} forgot email sent.`)
        }
      })

      return {
        ...user._doc,
      }
    } catch (err) {
      throw err
    }
  },
  deleteUser: async ({_id}, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findOne({_id}).populate(userPopulationObj)
      if (!user) throw new Error(JSON.stringify({
        type: "ID",
        message: "A User by that ID was not found!",
      }))

      await user.posts.forEach(async post => {
        await post.comments.forEach(async comment => {
          await Comment.deleteOne({ _id: comment._id })
        })
        await Post.deleteOne({ _id: post._id })
      })

      await User.deleteOne({ _id: req._id })

      // await emptyS3Directory(process.env.AWS_BUCKET, `${req._id}/`)

      console.log(`${user.email} deleted their account!`)

      return {
        ...user._doc,
      }
    } catch (err) {
      throw err
    }
  },
}
