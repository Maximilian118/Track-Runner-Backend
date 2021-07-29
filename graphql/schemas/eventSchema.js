module.exports = eventSchema = `
  type Event {
    _id: ID!
    user: ID!
    title: String!
    description: String
    location: String!
    startDate: String!
    endDate: String!
    img: String
    likes: Int!
    participants: [User]!
    tokens: String
  }

  input eventInput {
    user_id: ID!
    title: String!
    description: String
    location: String!
    startDate: String!
    endDate: String!
    img: String
  }
`