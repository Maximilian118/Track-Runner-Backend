// Population for followed Users.
const followedUsersPopulation = [
  {
    path: 'posts',
    model: 'Post',
    populate: [
      {
        path: 'user',
        model: 'User',
      },
    ],
  },
]

// Population for a Post.
const postPopulation = [
  {
    path: 'user',
    model: 'User',
  },
  {
    path: 'track',
    model: 'Track',
    populate: [
      {
        path: 'geojson',
        model: 'Geojson',
      },
    ],
  },
  {
    path: 'geojson',
    model: 'Geojson',
  },
]

// Population for a Track.
const trackPopulation = [
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

// Population for a User.
const userPopulation = [
  {
    path: 'posts',
    model: 'Post',
    populate: postPopulation,
  },
  {
    path: 'following',
    model: 'User',
    populate: followedUsersPopulation,
  },
  {
    path: 'tracks',
    model: 'Track',
    populate: trackPopulation,
  },
  {
    path: 'geojsons',
    model: 'Geojson',
  },
]

// Population for a Round.
const roundPopulation = [
  {
    path: 'track',
    model: 'Track',
    populate: trackPopulation,
  },
]

// Population for the feed.
const feedUserPopulation = [
  {
    path: 'posts',
    model: 'Post',
    populate: postPopulation,
  },
  {
    path: 'following',
    model: 'User',
    populate: followedUsersPopulation,
  },
]

exports.followedUsersPopulation = followedUsersPopulation
exports.postPopulation = postPopulation
exports.userPopulation = userPopulation
exports.trackPopulation = trackPopulation
exports.roundPopulation = roundPopulation
exports.feedUserPopulation = feedUserPopulation