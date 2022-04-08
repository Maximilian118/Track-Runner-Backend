module.exports = authSchema = `
  type Location {
    latitude: String
    longitude: String
    type: String
    distance: String
    name: String
    number: String
    postal_code: String
    street: String
    confidence: String
    region: String
    region_code: String
    county: String
    locality: String
    administrative_area: String
    neighbourhood: String
    country: String
    country_code: String
    continent: String
    label: String
    created_at: String
    updated_at: String
  }

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
    location: Location
    name: String!
    email: String!
    icon: String!
    profile_picture: String!
    likes: [ID]!
    logged_in_at: String!
    created_at: String!
    updated_at: String!
    password: String
    tokens: String
  }

  type Users {
    users: [User]!
    searchKey: String
    amount: Int
    tokens: String
  }

  input userInput {
    name: String!
    email: String!
    password: String!
    pass_confirm: String!
  }
`