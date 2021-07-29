module.exports = commentSchema = `
  type Comment {
    _id: ID!
    user: User!
    post: Post!
    comment: String!
    likes: Int!
    created_at: String!
    updated_at: String!
    tokens: String
  }
`