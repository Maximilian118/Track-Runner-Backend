const aws = require("aws-sdk")
const moment = require("moment")

const User = require("../models/user")
const Post = require("../models/post")
const Geojson = require("../models/geojson")

const { endpoint } = require("./utility")

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

const dbCheckPosts = async user => {
  let newPosts = user.posts

  await Promise.all(user.posts.map(async postID => { // loop through all the posts in user.
    const post = await Post.findById(postID).populate() // try and find post in the db.

    if (!post) { // If that post doesn't exist in the db.
      newPosts = newPosts.filter(p => p !== postID) 
    } else if (moment(post.updated_at).isBefore(moment().subtract(1, 'year'))) { // If post hasn't been updated in a year.
      newPosts = newPosts.filter(p => p !== postID) 
      await Post.deleteOne({ _id: postID }) // This post is very old so delete it from the db.
    }
  }))

  if (newPosts.length !== user.posts.length) {
    user.posts = newPosts
    user.updated_at = moment().format()
    await user.save()
  }
}

const dbCheckGeojsons = async user => {
  let newGeos = user.geojsons

  await Promise.all(user.geojsons.map(async geoID => { // loop through all the geojsons in user.
    const geojson = await Geojson.findById(geoID).populate() // try and find geojson in the db.

    if (!geojson) { // If that geojson doesn't exist in the db.
      newGeos = newGeos.filter(g => g !== geoID)
    } else if (!geojson.track && !geojson.post) { // Else if that geojson doesn't have a track ID or post ID.
      newGeos = newGeos.filter(g => g !== geoID)
      await Geojson.deleteOne({ _id: geoID }) // This geojson is useless so delete it from the db.
    }
  }))

  if (newGeos.length !== user.geojsons.length) { // If a geojson has been removed.
    user.geojsons = newGeos // update user.geojsons.
    user.updated_at = moment().format()
    await user.save()
  }
}

const s3CheckPP = async user => {
  await s3.listObjectsV2 ({ // Itterate through the users profile-pictures directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `${user._id}/profile-picture/`,
  }, (err, data) => {
    err && console.log(`RFC: /profile-picture/ ERR: ${err}`)

    if (data.Contents instanceof Array) {
      data.Contents.forEach(async file => { // For each object in user_id/profile-picture/ directory,
        if (file.Key !== endpoint(user.profile_picture)) { // check if the filename matches what's in the database.
          await s3.deleteObject({ // If it's not in the database, remove that file from s3.
            Bucket: process.env.AWS_BUCKET,
            Key: file.Key,
          }, err => err && console.log(err)).promise()
        }
      })
    } else {
      console.log('RFC: /profile-picture/ data.Contents is not an Array')
    }
  }).promise()
}

const s3CheckIcon = async user => {
  s3.listObjectsV2 ({ // Itterate through the users profile-pictures directory in s3.
    Bucket: process.env.AWS_BUCKET,
    MaxKeys: 100,
    Prefix: `${user._id}/icon/`,
  }, (err, data) => {
    err && console.log(`RFC: /icon/ ERR: ${err}`)

    if (data.Contents instanceof Array) {
      data.Contents.forEach(async file => { // For each object in the user_id/icon/ directory,
        if (file.Key !== endpoint(user.icon)) { // check if the filename matches what's in the database.
          await s3.deleteObject({ // If it's not in the database, remove that file from s3.
            Bucket: process.env.AWS_BUCKET,
            Key: file.Key,
          }, err => err && console.log(err)).promise()
        }
      })
    } else {
      console.log('RFC: /icon/ data.Contents is not an Array')
    }
  }).promise()
}

// Check the db for any unused objects.
// Also, check an AWS s3 user._id for any files that aren't referenced in the db for that user.
const redundantFilesCheck = async _id => {
  if (!navigator.onLine) {
    console.log('RFC: No Internet Connection!')
    return
  }

  await wait(3000) // Wait 3 seconds. This helps ensure db has new file information.

  const user = await User.findById(_id)
  if (!user) throw new Error("A User by that ID was not found!")

  // db
  await dbCheckGeojsons(user)
  await dbCheckPosts(user)

  // s3
  await s3CheckPP(user)
  await s3CheckIcon(user)
}

exports.redundantFilesCheck = redundantFilesCheck