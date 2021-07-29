module.exports = postSchema = `
  type Post {
    _id: ID!
    user: User!
    title: String!
    description: String!
    img: String!
    likes: Int!
    created_at: String!
    updated_at: String!
    comments: [Comment!]!
    tokens: String
  }

  input postInput {
    title: String!
    description: String!
    img: String!
    author: ID!
  }
`