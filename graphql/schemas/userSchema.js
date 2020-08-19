module.exports = authSchema = `
  type User {
    _id: ID!
    tokens: String!
    refresh_count: Int!
    name: String!
    email: String!
    profile_picture: String!
    posts: [Post]!
    following: [User]!
    calendar: [Post]!
    logged_in_at: String!
    created_at: String!
    updated_at: String!
    password: String
  }

  input userInput {
    name: String!
    email: String!
    password: String!
    pass_confirm: String!
  }
`