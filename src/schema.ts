import { createSchema } from 'graphql-yoga';
import { GraphQLResolveInfo } from 'graphql';
import { typeDefs, User, UserInput } from './types';

// 完整的 GraphQL 类型定义，包含查询和变更
const operationTypeDefs = /* GraphQL */ `
  type Query {
    getUser(id: ID!): User          # 获取单个用户
    getUsers: [User!]!              # 获取所有用户列表
  }

  type Mutation {
    createUser(input: UserInput!): User!     # 创建用户
    updateUser(id: ID!, input: UserInput!): User! # 更新用户
    deleteUser(id: ID!): Boolean!            # 删除用户
  }
`;

// 合并共享类型和操作类型
const combinedTypeDefs = [typeDefs, operationTypeDefs];

// 查询和变更参数接口
interface GetUserArgs {
  id: string;                       // 获取用户的 ID 参数
}

interface CreateUserArgs {
  input: UserInput;                 // 创建用户的输入
}

interface UpdateUserArgs {
  id: string;                       // 用户 ID
  input: UserInput;                 // 更新用户的输入
}

interface DeleteUserArgs {
  id: string;                       // 删除用户的 ID
}

// 解析器，处理查询和变更操作
const resolvers = {
  Query: {
    getUser: async (
      _: unknown,                    // 父对象，通常无需使用
      { id }: GetUserArgs,          // 查询参数
      context: { USERS_KV: KVNamespace }, // 上下文，包含 KV 存储
      info: GraphQLResolveInfo      // GraphQL 解析信息
    ): Promise<User | null> => {
      // 从 KV 存储中获取用户数据
      const userData = await context.USERS_KV.get(`user:${id}`);
      if (!userData) return null; // 用户不存在返回 null
      return JSON.parse(userData); // 解析并返回用户对象
    },
    getUsers: async (
      _: unknown,
      __: unknown,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User[]> => {
      // 获取所有用户（简化实现，生产环境需维护索引）
      const users: User[] = [];
      const prefix = 'user:';     // KV 键前缀
      const list = await context.USERS_KV.list({ prefix });
      for (const key of list.keys) {
        const userData = await context.USERS_KV.get(key.name);
        if (userData) users.push(JSON.parse(userData));
      }
      return users;               // 返回用户列表
    },
  },
  Mutation: {
    createUser: async (
      _: unknown,
      { input }: CreateUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User> => {
      const id = crypto.randomUUID();        // 生成唯一 ID
      const user: User = { id, ...input };   // 创建用户对象
      // 存储到 KV
      await context.USERS_KV.put(`user:${id}`, JSON.stringify(user));
      return user;                           // 返回创建的用户
    },
    updateUser: async (
      _: unknown,
      { id, input }: UpdateUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User> => {
      // 检查用户是否存在
      const userData = await context.USERS_KV.get(`user:${id}`);
      if (!userData) throw new Error('用户不存在');
      // 更新用户数据
      const updatedUser: User = { ...JSON.parse(userData), ...input, id };
      await context.USERS_KV.put(`user:${id}`, JSON.stringify(updatedUser));
      return updatedUser;                    // 返回更新后的用户
    },
    deleteUser: async (
      _: unknown,
      { id }: DeleteUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<boolean> => {
      // 检查用户是否存在
      const userData = await context.USERS_KV.get(`user:${id}`);
      if (!userData) return false;
      // 删除用户
      await context.USERS_KV.delete(`user:${id}`);
      return true;                           // 返回删除成功
    },
  },
};

// 创建 GraphQL schema
export const schema = createSchema({
  typeDefs: combinedTypeDefs,    // 合并的类型定义
  resolvers,                     // 解析器
});