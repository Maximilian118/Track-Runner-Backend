module.exports = authSchema = `
  type User {
    _id: ID!
    tokens: String!
    refresh_count: Int!
    posts: [Post]!
    tracks: [Track]!
    geojsons: [Geojson]!
    following: [User]!
    events: [Event]!
    calendars: [String]!
    champsCreated: [String]!
    name: String!
    email: String!
    profile_picture: String!
    likes: Int!
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