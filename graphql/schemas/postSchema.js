module.exports = postSchema = `
  type Post {
    _id: ID!
    user: User!
    title: String!
    description: String
    track: Track
    geojson: Geojson
    lap_time: String!
    distance: String!
    runDT: String!
    imgs: [String!]
    likes: Int!
    comments: [Comment!]
    created_at: String!
    updated_at: String!
    tokens: String
  }

  input postInput {
    title: String!
    description: String
    track: ID
    geojson: ID
    lapTime: String!
    distance: String!
    runDT: String!
    imgs: String
  }
`