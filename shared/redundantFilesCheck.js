const aws = require("aws-sdk")
const moment = require("moment")

const User = require("../models/user")
const Track = require("../models/track")
const Geojson = require("../models/geojson")

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'eu-west-2',
})

// Converts setTimeout into an async function.
const wait = async (ms) => {
  return new Promise(res => {
    setTimeout(res, ms)
  })
}

// Check the db for any unused objects.
// Also, check an AWS s3 user._id for any files that aren't referenced in the db for that user.
const redundantFilesCheck = async _id => {
  await wait(3000) // Wait 3s before continuing. This helps ensure db has new file information.

  const user = await User.findOne({ _id: _id })
  if (!user) throw new Error("A User by that ID was not found!")

  const tracks = await Track.find()
  if (tracks.length === 0) throw new Error("No Tracks were found in the database.... PANIC! ┻━┻︵ (°□°)/ ︵ ┻━┻")

  // db
  let newGeos = user.geojsons
  await Promise.all(user.geojsons.map(async geoID => {
    const geojson = await Geojson.findById(geoID).populate()

    if (!geojson) {
      newGeos = newGeos.filter(g => g !== geoID)
    } else if (!geojson.track && !geojson.post) {
      await Geojson.deleteOne({ _id: geoID })
    }
  }))

  if (newGeos.length !== user.geojsons.length) {
    user.geojsons = newGeos
    user.updated_at = moment().format()
    await user.save()
  }

  // AWS s3
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

exports.redundantFilesCheck = redundantFilesCheck