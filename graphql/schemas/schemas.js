const { buildSchema } = require("graphql")

const userSchema = require("./userSchema")
const postSchema = require("./postSchema")
const commentSchema = require("./commentSchema")
const trackSchema = require("./trackSchema")
const geojsonSchema = require("./geojsonSchema")
const miscSchema = require("./miscSchema")
const eventSchema = require("./eventSchema")

module.exports = buildSchema(`
  ${userSchema}
  ${postSchema}
  ${commentSchema}
  ${trackSchema}
  ${geojsonSchema}
  ${miscSchema}
  ${eventSchema}

  type rootQuery {
    user(_id: ID!): User! 
    users(searchKey: String! amount: Int!): Users!
    login(email: String!, password: String): User!
    track(user_id: ID, post_id: ID, track_id: ID, name: String): Track!
    post(post_id: ID!): Post!
    championship(championship: String!): Round!
    calendar(calendar: String!, calScope: Int): Round!
    signS3(filename: String!, filetype: String!): S3Payload!
    redundantFilesCheck: User!
    feed(fromDate: String!, toDate: String, amount: Int!): Feed!
  }

  type rootMutation {
    createUser(userInput: userInput): User!
    deleteUser(_id: String!): User!
    createPost(postInput: postInput): Post!
    createRound(roundInput: roundInput): Round!
    createTrack(trackInput: trackInput): Track!
    updateTrackLogo(track_id: ID, name: String, logo: String!): Track!
    createChampionship(champInput: champInput): Round!
    forgot(email: String!): User!
    updateProfilePicture(_id: ID!, profile_picture: String!, icon: String!): User!
    createGeojson(gpx: String!, filename: String!): Geojson!
    like(object_type: String!, object_id: ID!, action: String!): Like!
    createComment(post_id: ID!, comment: String!): Comment!
    updateLocation(location: String!): User!
    updateFollowing(user_id: String!): User!
  }

  schema {
    query: rootQuery
    mutation: rootMutation
  }
`)