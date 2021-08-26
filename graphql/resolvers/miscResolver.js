const moment = require("moment")
const aws = require("aws-sdk")

const User = require("../../models/user")
const Round = require("../../models/round")

const { 
  userPopulationObj,
  roundPopulationObj,
  isDuplicateProfilePicture,
  redundantFilesCheck,
  initRoundsArr,
} = require("../../shared/utility")

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

      const user = await User.findById(user_id).populate(userPopulationObj)
      if (user_id && !user) throw new Error("A User by that ID was not found!")

      const champName = JSON.parse(championship)[0].championship

      const champTest = await Round.findOne({championship: champName})
      if (champTest) throw new Error("A championship by that name already exists!")

      const championshipArr = []

      await JSON.parse(championship).forEach(async round => {
        const newRound = new Round(
          {
            user: user_id ? user_id : null,
            championship: champName,
            round: round.round,
            track: round.track,
            confirmed: round.confirmed,
            from: round.from,
            to: round.to,
            sessions: round.sessions ? JSON.stringify(round.sessions) : null,
          },
          err => {
            if (err) throw new Error(err)
          }
        )

        championshipArr.push(newRound._doc)
        await newRound.save()
      })

      if (user) {
        user.champsCreated.push(champName)
        user.updated_at = moment().format()
        await user.save()
        
        console.log(`${user.email} created a new championship: ${champName}!!!`)
      } else {
        console.log(`New championship: ${champName}!!!`)
      }

      return {
        rounds: JSON.stringify(championshipArr),
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
      const champ = await Round.find({championship: championship}).populate(roundPopulationObj)
      if (!champ || champ.length === 0) throw new Error("Championship not found!")

      const sortedChamp = champ.sort((a, b) => (a.round > b.round) ? 1 : -1)
      
      return {
        rounds: JSON.stringify(sortedChamp),
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
      const cal = await Round.find({calendars: calendar}).populate(roundPopulationObj)
      if (!cal || cal.length === 0) throw new Error("Calendar not found!")

      const sortedCal = []

      if (!calScope) calScope = 365

      for (let i = 0; i < calScope; i++) {
        const date = moment().add(i, "d").format()
        let roundData = {}
  
        cal.forEach(round => {
          if (moment(date).isAfter(round.from) && moment(date).isBefore(round.to)) {
            roundData = round._doc
          } 
        })
  
        sortedCal.push({
          date: date,
          events: [],
          ...roundData,
        })
      }

      return {
        rounds: JSON.stringify(initRoundsArr(sortedCal)),
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
      const _id = await filename.substring(0, filename.indexOf("/"))

      const user = await User.findById(_id)
      if (!user) throw new Error("A User by that ID was not found!")

      if (filename.includes("profile-picture")) {
        if (isDuplicateProfilePicture(user, filename)) throw new Error("Duplicate Profile Picture!")
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
}