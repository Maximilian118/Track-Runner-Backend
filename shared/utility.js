const User = require("../models/user")

const jwt = require("jsonwebtoken")
const aws = require("aws-sdk")

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

exports.userPopulationObj = userPopulationObj
exports.trackPopulationObj = trackPopulationObj
exports.roundPopulationObj = roundPopulationObj
exports.emptyS3Directory = emptyS3Directory
exports.redundantFilesCheck = redundantFilesCheck
exports.signTokens = signTokens