// Population object for a Post.
const postPopulationObj = [
  {
    path: 'user',
    model: 'User',
  },
  {
    path: 'track',
    model: 'Track',
  },
  {
    path: 'geojson',
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

// Population object for a User.
const userPopulationObj = [
  {
    path: 'posts',
    model: 'Post',
    populate: postPopulationObj,
  },
  {
    path: 'following',
    model: 'User',
    populate: {
      path: 'posts',
      model: 'Post',
      populate: [
        {
          path: 'user',
          model: 'User',
        },
      ],
    },
  },
  {
    path: 'tracks',
    model: 'Track',
    populate: trackPopulationObj,
  },
  {
    path: 'geojsons',
    model: 'Geojson',
  },
]

// Population object for a Round.
const roundPopulationObj = [
  {
    path: 'track',
    model: 'Track',
    populate: trackPopulationObj,
  },
]

exports.postPopulationObj = postPopulationObj
exports.userPopulationObj = userPopulationObj
exports.trackPopulationObj = trackPopulationObj
exports.roundPopulationObj = roundPopulationObj