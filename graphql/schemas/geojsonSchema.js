module.exports = geojsonSchema = `
  type Geojson {
    _id: ID!
    user: ID
    post: ID
    name: String!
    geojson: String!
    stats: String
    created_at: String!
    updated_at: String!
    tokens: String
  }

  input geojsonInput {
    user_id: ID
    post_id: ID
    name: String!
    geojson: String!
  }
`