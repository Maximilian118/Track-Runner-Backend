module.exports = miscSchema = `
  type S3Payload {
    signedRequest: String!,
    url: String!,
    tokens: String,
  }

  type Rounds {
    rounds: String!
    tokens: String
  }

  input champInput {
    user_id: ID
    championship: String!
  }
`