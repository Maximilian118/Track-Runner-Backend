module.exports = eventSchema = `
  type Event {
    _id: ID!
    title: String!
    description: String!
    location: String!
    startDate: String!
    endDate: String!
    img: String!
    participants: User!
    created_at: String!
    updated_at: String!
  }

  input eventInput {
    title: String!
    description: String!
    location: String!
    startDate: String!
    endDate: String!
    img: String!
  }
`