module.exports = geojsonSchema = `
  type Geojson {
    _id: ID!
    user: ID
    post: ID
    name: String!
    geojson: String!
    created_at: String!
    updated_at: String!
  }

  input geojsonInput {
    user_id: ID
    post_id: ID
    name: String!
    geojson: String!
  }
`