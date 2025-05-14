import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
  }

  type Query {
    todos: [Todo!]!
    test: String!
  }

  type Mutation {
    createTodo(title: String!): Todo!
    updateTodo(id: ID!, title: String, completed: Boolean): Todo
    deleteTodo(id: ID!): Boolean!
  }
`;

export const schema = makeExecutableSchema({ typeDefs });