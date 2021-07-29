module.exports = miscSchema = `
  type Rounds {
    rounds: String!
    tokens: String
  }

  input champInput {
    user_id: ID
    championship: String!
  }
`