// src/schema.ts
import { createSchema } from 'graphql-yoga';
import { GraphQLResolveInfo } from 'graphql';

// 定义你的 GraphQL 类型和查询
const typeDefs = /* GraphQL */ `
  type Query {
    hello: String!
    randomInt(min: Int!, max: Int!): Int!
    user(id: ID!): User
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }
`;

// 定义 User 类型的接口
interface User {
  id: string;
  name: string;
  email: string;
}

// 定义解析器函数的参数类型
interface RandomIntArgs {
  min: number;
  max: number;
}

interface UserArgs {
  id: string;
}

// 定义查询字段的解析器函数
const resolvers = {
  Query: {
    hello: (): string => 'Hello from GraphQL Yoga on Cloudflare Worker!',
    randomInt: (
      _: unknown, // 父对象，通常不需要，用 unknown 或 any 标记
      { min, max }: RandomIntArgs, // 使用接口定义参数类型
      context: Record<string, any>, // 上下文对象，包含请求信息等
      info: GraphQLResolveInfo // 包含当前解析过程的信息
    ): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    user: (
      _: unknown,
      { id }: UserArgs,
      context: Record<string, any>,
      info: GraphQLResolveInfo
    ): User | undefined => {
      // 模拟从数据源获取用户数据
      const users: User[] = [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
      return users.find(user => user.id === id);
    },
  },
};

// 使用 typeDefs 和 resolvers 创建 GraphQL schema
export const schema = createSchema({
  typeDefs,
  resolvers,
});