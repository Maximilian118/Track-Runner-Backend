const { buildSchema } = require("graphql")
const userSchema = require("./userSchema")
const postSchema = require("./postSchema")
const commentSchema = require("./commentSchema")

module.exports = buildSchema(`
  ${userSchema}
  ${postSchema}
  ${commentSchema}

  type rootQuery {
    user(_id: ID!): User!
    login(email: String!, password: String): User!
  }

  type rootMutation {
    createUser(userInput: userInput): User!
    deleteUser(_id: String!): User!
    forgot(email: String!): User!
  }

  schema {
    query: rootQuery
    mutation: rootMutation
  }
`)