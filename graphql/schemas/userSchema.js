module.exports = authSchema = `
  type User {
    _id: ID!
    refresh_count: Int!
    posts: [Post]!
    tracks: [Track]!
    geojsons: [Geojson]!
    following: [User]!
    events: [Event]!
    rounds: [Round]!
    calendars: [String]!
    championships: [String]!
    name: String!
    email: String!
    icon: String!
    profile_picture: String!
    likes: Int!
    logged_in_at: String!
    created_at: String!
    updated_at: String!
    password: String
    tokens: String
  }

  input userInput {
    name: String!
    email: String!
    password: String!
    pass_confirm: String!
  }
`