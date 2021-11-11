module.exports = miscSchema = `
  type S3Payload {
    signedRequest: String!,
    url: String!,
    tokens: String,
  }

  type Feed {
    feed: String!
    tokens: String
  }

  type Like {
    object_type: String!
    object_id: ID!
    old_likes: [ID]!
    old_likes_length: Int!
    new_likes: [ID]!
    new_likes_length: Int!
    tokens: String
  }

  type Round {
    _id: ID!
    user: ID
    calendars: [String!]!
    year: Int!
    championship: String!
    round: Int!
    track: ID!
    confirmed: Boolean!
    from: String!
    to: String!
    sessions: String!
    likes: [ID]!
    created_at: String!
    updated_at: String!
    rounds: String
    tokens: String
  }

  input roundInput {
    user_id: ID
    roundObj: String!
  }

  input champInput {
    user_id: ID
    championship: String!
  }
`