module.exports = commentSchema = `
  type Comment {
    _id: ID!
    user: User!
    post: Post!
    tokens: String!
    comment: String!
    likes: Int!
    created_at: String!
    updated_at: String!
  }
`