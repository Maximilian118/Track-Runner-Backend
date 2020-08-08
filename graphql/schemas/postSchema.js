module.exports = postSchema = `
  type Post {
    _id: ID!
    tokens: String!
    title: String!
    description: String!
    img: String!
    author: User!
    created_at: String!
    updated_at: String!
    comments: [Comment!]!
  }

  input postInput {
    title: String!
    description: String!
    img: String!
    author: ID!
  }
`