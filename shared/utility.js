const jwt = require("jsonwebtoken")
const aws = require("aws-sdk")
const gpxParser = require('gpxparser')

const User = require("../models/user")

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

// Completely empties an AWS s3 directory.
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
  await wait(3000) // wait 3s before continuing = ensure db has new file information.

  const user = await User.findOne({ _id: _id }).populate("posts")
  if (!user) throw new Error("A User by that ID was not found!")

  const currentPP = user.profile_picture.substring(user.profile_picture.indexOf("amazonaws.com/") + 14)
  const currentPosts = user.posts.map(post => post.img.substring(post.img.indexOf("amazonaws.com/") + 14))

  await currentPP && s3.listObjectsV2 ({ // Itterate through the users profile-pictures directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `${_id}/profile-picture/`,
  }, (err, data) => {
    err && console.log(err)
    data.Contents.forEach(async file => { // For each object in that directory,
      if (file.Key !== currentPP) { // check if the filename matches what's in the database.
        await s3.deleteObject({ // If it's not in the database, remove that file from s3.
          Bucket: process.env.AWS_BUCKET,
          Key: file.Key,
        }, err => err && console.log(err)).promise()
      }
    })
  }).promise()

  currentPosts.length > 0 && await s3.listObjectsV2 ({ // Itterate though the users directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `${_id}/`,
  }, (err, data) => {
    err && console.log(err)
    data.Contents.forEach(async file => { // For each object in that directory,
      for await (const postURL of currentPosts) { // itterate through all of the current posts the user has.
        if (file.Key === postURL) { // If the filename matches the post filename, return. 
          return
        }
      }

      if (file.Key.includes("profile-picture")) { // If the file is a Profile Picture, return.
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

  return withData
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