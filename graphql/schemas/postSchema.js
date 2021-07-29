module.exports = postSchema = `
  type Post {
    _id: ID!
    user: User!
    tokens: String!
    title: String!
    description: String!
    img: String!
    likes: Int!
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