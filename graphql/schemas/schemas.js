const { buildSchema } = require("graphql")

const userSchema = require("./userSchema")
const postSchema = require("./postSchema")
const commentSchema = require("./commentSchema")
const trackSchema = require("./trackSchema")
const geojsonSchema = require("./geojsonSchema")
const championshipSchema = require("./championshipSchema")
const eventSchema = require("./eventSchema")

module.exports = buildSchema(`
  ${userSchema}
  ${postSchema}
  ${commentSchema}
  ${trackSchema}
  ${geojsonSchema}
  ${championshipSchema}
  ${eventSchema}

  type rootQuery {
    user(_id: ID!): User! 
    login(email: String!, password: String): User!
    track(user_id: ID, post_id: ID, track_id: ID, name: String): Track!
    championship(championship: String!): String!
    calendar(calendar: String!, calScope: Int): String!
  }

  type rootMutation {
    createUser(userInput: userInput): User!
    deleteUser(_id: String!): User!
    forgot(email: String!): User!
    createTrack(trackInput: trackInput): Track!
    createChampionship(champInput: champInput): String!
  }

  schema {
    query: rootQuery
    mutation: rootMutation
  }
`)