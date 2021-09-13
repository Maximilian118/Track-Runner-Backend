const jwt = require("jsonwebtoken")
const aws = require("aws-sdk")
const gpxParser = require('gpxparser')
const moment = require("moment")

const User = require("../models/user")
const Track = require("../models/track")

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'eu-west-2',
})

// Population object for a User.
const userPopulationObj = [
  {
    path: 'posts',
    model: 'Post',
    populate: [
      {
        path: 'author',
        model: 'User',
      },
    ],
  },
  {
    path: 'following',
    model: 'User',
    populate: {
      path: 'posts',
      model: 'Post',
      populate: [
        {
          path: 'author',
          model: 'User',
        },
      ],
    },
  },
  {
    path: 'tracks',
    model: 'Track',
    populate: [
      {
        path: 'geojson',
        model: 'Geojson',
      },
    ],
  },
  {
    path: 'geojsons',
    model: 'Geojson',
  },
]

// Population object for a Track.
const trackPopulationObj = [
  {
    path: 'geojson',
    model: 'Geojson',
  },
  {
    path: 'user',
    model: 'User',
  },
  {
    path: 'post',
    model: 'Post',
  },
]

// Population object for a Round.
const roundPopulationObj = [
  {
    path: 'track',
    model: 'Track',
    populate: [
      {
        path: 'geojson',
        model: 'Geojson',
      },
      {
        path: 'user',
        model: 'User',
      },
      {
        path: 'post',
        model: 'Post',
      },
    ]
  },
]

// Check for a duplicate filename by comparing the filename endpoints.
const isDuplicateFile = (currentFile, newFile) => {
  const currentF = currentFile.substring(currentFile.lastIndexOf("/") + 1)
  const newF = newFile.substring(newFile.lastIndexOf("/") + 1)

  if (currentF === newF) {
    return true
  } else {
    return false
  }
}

// Completely empty the s3 directory of a given user.
const emptyS3Directory = async (bucket, dir) => {
  const listParams = {
    Bucket: bucket,
    Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise()

  if (listedObjects.Contents.length === 0) return

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  }

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key })
  })

  await s3.deleteObjects(deleteParams).promise()

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir)
}

// Converts setTimeout into an async function.
const wait = async (ms) => {
  return new Promise(res => {
    setTimeout(res, ms)
  })
}

// Check an AWS s3 _id for any files that aren't referenced in the db for that user.
const redundantFilesCheck = async _id => {
  await wait(3000) // Wait 3s before continuing. This helps ensure db has new file information.

  const user = await User.findOne({ _id: _id }).populate("posts")
  if (!user) throw new Error("A User by that ID was not found!")

  const tracks = await Track.find()
  if (tracks.length === 0) throw new Error("No Tracks were found in the database.... PANIC!")

  const currentProfilePicture = user.profile_picture.substring(user.profile_picture.indexOf("amazonaws.com/") + 14)
  const currentIcon = user.icon.substring(user.icon.indexOf("amazonaws.com/") + 14)

  await currentProfilePicture && s3.listObjectsV2 ({ // Itterate through the users profile-pictures directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `${_id}/profile-picture/`,
  }, (err, data) => {
    err && console.log(err)
    data.Contents.forEach(async file => { // For each object in user_id/profile-picture/ directory,
      if (file.Key !== currentProfilePicture) { // check if the filename matches what's in the database.
        await s3.deleteObject({ // If it's not in the database, remove that file from s3.
          Bucket: process.env.AWS_BUCKET,
          Key: file.Key,
        }, err => err && console.log(err)).promise()
      }
    })
  }).promise()

  await currentIcon && s3.listObjectsV2 ({ // Itterate through the users profile-pictures directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `${_id}/icon/`,
  }, (err, data) => {
    err && console.log(err)
    data.Contents.forEach(async file => { // For each object in the user_id/icon/ directory,
      if (file.Key !== currentIcon) { // check if the filename matches what's in the database.
        await s3.deleteObject({ // If it's not in the database, remove that file from s3.
          Bucket: process.env.AWS_BUCKET,
          Key: file.Key,
        }, err => err && console.log(err)).promise()
      }
    })
  }).promise()

  await tracks.length > 0 && s3.listObjectsV2 ({ // Itterate though the track-logo directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `track-logo/`,
  }, (err, data) => {
    err && console.log(err)
    data.Contents.forEach(async file => { // For each object in the track-logo/ directory,
      for await (const track of tracks) { // itterate through all of the track-logos.
        const trackURL = track.logo.substring(track.logo.indexOf("amazonaws.com/") + 14)
        if (file.Key === trackURL) { // If the filename matches the track filename, return. 
          return
        }
      }

      // If the file is a Profile Picture or an Icon, return.
      if (file.Key.includes("profile-picture") || file.Key.includes("icon")) {
        return
      }

      await s3.deleteObject({ // Remove file from s3.
        Bucket: process.env.AWS_BUCKET,
        Key: file.Key,
      }, err => err && console.log(err)).promise()
    })
  }).promise()
}

// Sign Tokens with JWT.
const signTokens = user => {
  const access_token = jwt.sign(
    { 
      _id: user._id,
    }, 
    `${process.env.ACCESS_TOKEN_SECRET}`, 
    { expiresIn: "15m" }
  )

  const refresh_token = jwt.sign(
    { 
      _id: user._id,
      refresh_count: user.refresh_count,
    }, 
    `${process.env.REFRESH_TOKEN_SECRET}`, 
    { expiresIn: "7d" }
  )

  return {
    access_token, 
    refresh_token,
  }
}

// Convert a stringified GPX file to geojson and generate data.
const GPXtoGeojson = gpxString => {
  const gpx = new gpxParser()
  gpx.parse(gpxString)

  const slopes = []
  gpx.tracks[0].slopes.forEach(slope => {
    if (!isNaN(slope)) {
      slopes.push(Number(slope.toFixed(2)))
    }
  })

  return {
    geojson: gpx.toGeoJSON(),
    distance: {
      ...gpx.tracks[0].distance,
      total: Number(gpx.tracks[0].distance.total.toFixed(2)),
      cumul: gpx.tracks[0].distance.cumul.map(dist => Number(dist.toFixed(2))),
    },
    elevation: {
      ...gpx.tracks[0].elevation,
      pos: Number(gpx.tracks[0].elevation.pos.toFixed(2)),
      neg: Number(gpx.tracks[0].elevation.neg.toFixed(2)),
      avg: Number(gpx.tracks[0].elevation.avg.toFixed(2)),
      dif: Number(Math.abs(gpx.tracks[0].elevation.max - gpx.tracks[0].elevation.min).toFixed(2)),
      elevArr: gpx.tracks[0].points.map(point => Number(point.ele.toFixed(2))),
    },
    slopes,
  }
}

// Return an array of stats depending on what data is available.
const trackStatsArr = (round, trackStats, geoStats) => {
  let statArr = [
    {
      name: "Round",
      stat: round.round,
    },
  ]

  trackStats && statArr.push(
    {
      name: "Turns",
      stat: trackStats.turns,
    },
    {
      name: "Distance",
      stat: `${trackStats.distance}km`,
    },
  )

  geoStats && statArr.push(
    {
      name: "MaxElev",
      stat: `${geoStats.elevation.max}m`,
    },
    {
      name: "MinElev",
      stat: `${geoStats.elevation.min}m`,
    },
    {
      name: "ElevChange",
      stat: `${geoStats.elevation.dif}m`,
    },
  )

  return statArr
}

// Add day key to each round with a track. day++ for each day in a round.
const withConsecDays = rounds => {
  const withDays = []
  let day = 0

  rounds.forEach((round, i) => {
    if (round.round) {
      if (round.track) {        
        if (moment().isBetween(round.from, round.to)) {
          day = i + 1 + moment().diff(moment(round.from), 'd')
        } else if (withDays[i - 1] && withDays[i - 1].round === round.round) {
          day++
        } else {
          day = 1
        }

        withDays.push({
          ...round,
          day,
        })
      } else {
        day = 0
        withDays.push(round)
      }
    } else {
      day = 0
      withDays.push(round)
    }
  })

  return withDays
}

// Return an array of rounds with supplementary data.
const roundData = rounds => {
  let withData = []

  rounds.forEach(round => {
    if (round.round) {
      let trackStats = null
      let geoStats = null

      if (round.track) {
        trackStats = JSON.parse(round.track.stats)
        if (round.track.geojson) {
          geoStats = JSON.parse(round.track.geojson.stats)
        }
      }

      withData.push({
        ...round,
        track: round.track? {
          ...round.track._doc,
          trackStatsArr: trackStatsArr(round, trackStats, geoStats)
        } : null
      })
    } else {
      withData.push(round)
    }
  })

  return withConsecDays(withData)
}

exports.isDuplicateFile = isDuplicateFile
exports.userPopulationObj = userPopulationObj
exports.trackPopulationObj = trackPopulationObj
exports.roundPopulationObj = roundPopulationObj
exports.emptyS3Directory = emptyS3Directory
exports.redundantFilesCheck = redundantFilesCheck
exports.signTokens = signTokens
exports.GPXtoGeojson = GPXtoGeojson
exports.roundData = roundData