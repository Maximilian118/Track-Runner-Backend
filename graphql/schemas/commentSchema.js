module.exports = commentSchema = `
  type Comment {
    _id: ID!
    user: User!
    post: Post!
    comment: String!
    likes: [ID]!
    created_at: String!
    updated_at: String!
    tokens: String
  }
`