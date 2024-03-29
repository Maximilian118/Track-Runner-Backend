const jwt = require("jsonwebtoken")
const aws = require("aws-sdk")
const gpxParser = require('gpxparser')
const moment = require("moment")

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'eu-west-2',
})

// Get the endpoint of a url
const endpoint = str => str.substring(str.lastIndexOf("/") + 1)
const s3FileKey = str => str.substring(str.indexOf("amazonaws.com/") + 14)
const formatString = str => str.toLowerCase().replace(/[^a-z0-9]/g, "-")
const getEndpoint = passed => endpoint(passed.type ? formatString(passed.name) : passed)

// Check for a duplicate filename by comparing the filename endpoints.
const isDuplicateFile = (currentFile, newFile) => {
  const currentF = endpoint(currentFile)
  const newF = endpoint(newFile)

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

// Find the average number from an array of numbers.
const findAvgNumber = arr => arr.reduce(( p, c ) => p + c, 0) / arr.length

// Find the average lat and lon of a GPX file or Array of geojson coordinates.
const findAvgGPXLatLon = points => {
  const lats = []
  const lons = []
  
  points.forEach(point => {
    const isGPX = !!point.lat && !!point.lon
    
    if (isGPX) {
      lats.push(point.lat)
      lons.push(point.lon)
    } else {
      lats.push(point[1])
      lons.push(point[0])
    }
  })

  return {
    lat: Number(findAvgNumber(lats).toFixed(6)),
    lon: Number(findAvgNumber(lons).toFixed(6)),
  }
}

// Find the average in an array of numbers.
const intsAverage = arr => arr.reduce(( p, c ) => p + c, 0) / arr.length

// Check if a val is a valid number.
const validInt = val => !isNaN(val) && val !== -Infinity

// Find the next valid number in an array.
const findNextValid = (arr, errIndex) => {
  let valid = null

  for (let i = 0; i < arr.length; i++) {
    const val = arr[(i + errIndex) % arr.length]

    if (validInt(val)) {
      valid = val
      break
    }
  }

  return valid
}

// Smooth the slope array.
// If length passed then smooth.length === length.
const smoothInts = (arr, length) => {
  const smooth = []

  arr.forEach((int, i) => {
    if (!validInt(int)) {
      int = findNextValid(arr, i)
    }

    const avg = Number(intsAverage([ 
      validInt(arr[i-2]) ? arr[i-2] : int,
      validInt(arr[i-1]) ? arr[i-1] : int,
      int,
      validInt(arr[i+1]) ? arr[i+1] : int,
      validInt(arr[i+2]) ? arr[i+2] : int,
    ]).toFixed(2))

    validInt(avg) && smooth.push(avg)
  })

  if (length && !isNaN(length) && length !== smooth.length) {
    const larger = length > smooth.length
    const loops = larger ? length - smooth.length : smooth.length - length

    for (let i = 0; i < loops; i++) {
      if (larger) {
        smooth.push(smooth.at(-1))
      } else {
        smooth.pop()
      }
    }
  }

  return smooth
}

// Convert a stringified GPX file to geojson and generate data.
const GPXtoGeojson = gpxString => {
  const gpx = new gpxParser()
  gpx.parse(gpxString)

  const elevArr = gpx.tracks[0].points.map(point => Number(point.ele.toFixed(2)))
  const total = Number(gpx.tracks[0].distance.total.toFixed(2))

  return {
    coords: findAvgGPXLatLon(gpx.tracks[0].points),
    geojson: gpx.toGeoJSON(),
    distance: {
      ...gpx.tracks[0].distance,
      total,
      totalKm: Number((total / 1000).toFixed(3)),
      cumul: gpx.tracks[0].distance.cumul.map(dist => Number(dist.toFixed(2))),
    },
    elevation: {
      ...gpx.tracks[0].elevation,
      pos: Number(gpx.tracks[0].elevation.pos.toFixed(2)),
      neg: Number(gpx.tracks[0].elevation.neg.toFixed(2)),
      avg: Number(gpx.tracks[0].elevation.avg.toFixed(2)),
      dif: Number(Math.abs(gpx.tracks[0].elevation.max - gpx.tracks[0].elevation.min).toFixed(2)),
      elevArr,
    },
    slopes: smoothInts(gpx.tracks[0].slopes, elevArr.length),
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

exports.smoothInts = smoothInts
exports.endpoint = endpoint
exports.s3FileKey = s3FileKey
exports.formatString = formatString
exports.getEndpoint = getEndpoint
exports.isDuplicateFile = isDuplicateFile
exports.emptyS3Directory = emptyS3Directory
exports.signTokens = signTokens
exports.GPXtoGeojson = GPXtoGeojson
exports.roundData = roundData
exports.findAvgGPXLatLon = findAvgGPXLatLon