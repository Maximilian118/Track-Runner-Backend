const moment = require("moment")
const aws = require("aws-sdk")

const User = require("../../models/user")
const Track = require("../../models/track")
const Round = require("../../models/round")
const Post = require('../../models/post')

const { 
  isDuplicateFile,
  roundData,
} = require("../../shared/utility")

const {
  userPopulation,
  trackPopulation,
  roundPopulation,
} = require("../../shared/population")

const { redundantFilesCheck } = require("../../shared/redundantFilesCheck")

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'eu-west-2',
})

module.exports = {
  createChampionship: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const { user_id, championship } = args.champInput
      const champ = JSON.parse(championship)

      const user = await User.findById(user_id).populate(userPopulation)
      if (user_id && !user) throw new Error("A User by that ID was not found!")

      let champName = null
      champ.forEach((round, i) => {
        if (i === 0) {
          champName = round.championship
        } else if (champName !== round.championship) {
          throw new Error("All Rounds must belong to the same championship!")
        }
      })
      
      const duplicate = await Round.findOne({championship: champName})
      if (duplicate) throw new Error("A championship by that name already exists!")

      const champArr = await Promise.all(champ.map(async round => {
        const track = await Track.findOne({name: round.track}).populate(trackPopulation)
        if (!track && round.track !== "TBA") throw new Error(`A Track by the name of ${round.track} was not found!`)

        const newRound = new Round(
          {
            user: user_id ? user_id : null,
            calendars: round.calendars,
            year: round.year,
            championship: round.championship,
            round: round.round,
            track: track ? track._id : null,
            confirmed: round.confirmed,
            from: round.from,
            to: round.to,
            sessions: round.sessions ? JSON.stringify(round.sessions) : null,
          },
          err => {
            if (err) throw new Error(err)
          }
        )
        
        await newRound.save()

        return {
          ...newRound._doc,
          track,
        }
      }))

      if (user) {
        user.champsCreated.push(champName)
        user.updated_at = moment().format()
        await user.save()
        
        console.log(`${user.email} created a new championship: ${champName}!!!`)
      } else {
        console.log(`New championship: ${champName}!!!`)
      }

      return {
        rounds: JSON.stringify(roundData(champArr)),
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  createRound: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const { user_id, roundObj } = args.roundInput
      const round = JSON.parse(roundObj)

      const user = await User.findById(user_id).populate(userPopulation)
      if (user_id && !user) throw new Error("A User by that ID was not found!")

      const champs = await Round.find({championship: round.championship})
      champs.forEach(champ => {
        if (champ.round === round.round) throw new Error("A Round by that round number in that championship already exists!")
      })

      const track = await Track.findOne({name: round.track})
      if (!track) throw new Error("A Track by that name was not found!")

      const newRound = new Round(
        {
          user: user_id ? user_id : null,
          calendars: round.calendars,
          year: round.year,
          championship: round.championship,
          round: round.round,
          track: track._id,
          confirmed: round.confirmed,
          from: round.from,
          to: round.to,
          sessions: round.sessions ? JSON.stringify(round.sessions) : null,
        },
        err => {
          if (err) throw new Error(err)
        }
      )

      await newRound.save()

      if (user) {
        user.rounds.push(newRound._id)
        user.updated_at = moment().format()
        await user.save()
        
        console.log(`${user.email} created a new round. Round ${round.round} of ${round.championship}!`)
      } else {
        console.log(`New round: Round ${round.round} of ${round.championship}!`)
      }

      return {
        ...newRound._doc,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  championship: async ({championship}, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const champ = await Round.find({championship: championship}).populate(roundPopulation)
      if (!champ || champ.length === 0) throw new Error("Championship not found!")

      const sortedChamp = champ.sort((a, b) => (a.round > b.round) ? 1 : -1)
      
      return {
        rounds: JSON.stringify(roundData(sortedChamp)),
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  calendar: async ({calendar, calScope}, req) => {
    if (!req.isAuth && calendar !== "F1") {
      throw new Error("Not Authenticated!")
    }
    try {
      const cal = await Round.find({calendars: calendar}).populate(roundPopulation)
      if (!cal || cal.length === 0) throw new Error("Calendar not found!")

      const sortedCal = []

      if (!calScope) calScope = 365

      for (let i = 0; i < calScope; i++) {
        const date = moment().add(i, "d").format("YYYY-MM-DD")
        let roundData = {}
  
        cal.forEach(round => {      
          const from = moment(round.from).format("YYYY-MM-DD")
          const to = moment(round.to).format("YYYY-MM-DD")

          if (moment(date).isBetween(from, to, undefined, '[]')) {
            roundData = round._doc
          }
        })
  
        sortedCal.push({
          date: date,
          dotw: moment(date).format("dddd"),
          events: [],
          ...roundData,
        })
      }

      return {
        rounds: JSON.stringify(roundData(sortedCal)),
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  signS3: async ({ filename, filetype }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findById(req._id)
      if (!user) throw new Error("A User by that ID was not found!")

      if (filename.includes("profile-picture")) {
        if (isDuplicateFile(user.profile_picture, filename)) throw new Error("Duplicate Profile Picture!")
      } else if (filename.includes("icon")) {
        if (isDuplicateFile(user.icon, filename)) throw new Error("Duplicate Icon!")
      }

      const s3Params = {
        Bucket: process.env.AWS_BUCKET,
        Key: filename,
        Expires: 60,
        ContentType: filetype,
        ACL: 'public-read',
      }

      const signedRequest = s3.getSignedUrl('putObject', s3Params)
      const url = `http://${process.env.AWS_BUCKET}.s3.eu-west-2.amazonaws.com/${filename}`

      return {
        signedRequest,
        url,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  redundantFilesCheck: async ({}, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      const user = await User.findById(req._id)
      if (!user) throw new Error("A User by that ID was not found!")

      await redundantFilesCheck(req._id)

      return {
        ...user._doc,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
  like: async ({ object_type, object_id, action }, req) => {
    if (!req.isAuth) {
      throw new Error("Not Authenticated!")
    }
    try {
      let object = null

      switch (object_type) {
        case "post": object = await Post.findById(object_id); break
        case "track": object = await Track.findById(object_id); break
        case "round": object = await Round.findById(object_id); break
        default: object = null
      }

      if (!object) throw new Error(`A ${object_type} by that ID was not found!`)
      if (!('likes' in object)) throw new Error(`The object ${object_type} does not possess a likes key.`)

      const old_likes = object.likes
      let new_likes = null

      switch (action) {
        case "add": new_likes = [ ...object.likes, req._id ]; break
        case "remove": new_likes = object.likes.filter(user_id => user_id.toString() !== req._id); break
        default: new_likes = null
      }

      if (new_likes instanceof Array) {
        object.likes = new_likes
        await object.save()
      } else {
        throw new Error(`Invalid action.`)
      }

      return {
        object_type,
        object_id,
        old_likes,
        old_likes_length: old_likes.length,
        new_likes,
        new_likes_length: new_likes.length,
        tokens: req.tokens,
      }
    } catch (err) {
      throw err
    }
  },
}