module.exports = trackSchema = `
  type Track {
    _id: ID!
    user: ID,
    post: ID,
    name: String!,
    country: String!,
    location: String!,
    logo: String,
    geojson: Geojson,
    stats: String,
    likes: [ID]!
    created_at: String!,
    updated_at: String!,
    tracks: String!
    tokens: String
  }

  input trackInput {
    user_id: ID,
    post_id: ID,
    name: String!,
    country: String!,
    location: String!,
    logo: String,
    geojson: ID,
    gpx: String,
    stats: String,
  }
`