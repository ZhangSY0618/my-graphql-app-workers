import { createSchema } from 'graphql-yoga';
import { GraphQLResolveInfo } from 'graphql';
import { typeDefs, User, UserInput } from './types';

// GraphQL 类型定义
const operationTypeDefs = /* GraphQL */ `
  type Query {
    getUser(id: ID!): User
    getUsers: [User!]!
  }

  type Mutation {
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`;

const combinedTypeDefs = [typeDefs, operationTypeDefs];

// 解析器参数接口
interface GetUserArgs {
  id: string;
}

interface CreateUserArgs {
  input: UserInput;
}

interface UpdateUserArgs {
  id: string;
  input: UserInput;
}

interface DeleteUserArgs {
  id: string;
}

const resolvers = {
  Query: {
    getUser: async (
      _: unknown,
      { id }: GetUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User | null> => {
      try {
        if (!context.USERS_KV) {
          console.error('USERS_KV 未定义');
          throw new Error('KV 命名空间未绑定');
        }
        const userData = await context.USERS_KV.get(`user:${id}`);
        if (!userData) {
          console.log(`未找到 ID 为 ${id} 的用户`);
          return null;
        }
        const parsed = JSON.parse(userData);
        if (!parsed.id || !parsed.name || !parsed.email) {
          console.error(`ID ${id} 的用户数据无效`, parsed);
          throw new Error('用户数据格式错误');
        }
        return parsed;
      } catch (error) {
        console.error(`获取用户 ID ${id} 失败:`, error);
        throw new Error(`获取用户失败: ${error.message}`);
      }
    },
    getUsers: async (
      _: unknown,
      __: unknown,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User[]> => {
      try {
        if (!context.USERS_KV) {
          console.error('USERS_KV 未定义');
          throw new Error('KV 命名空间未绑定');
        }
        const users: User[] = [];
        const prefix = 'user:';
        const list = await context.USERS_KV.list({ prefix });
        console.log(`在 USERS_KV 中找到 ${list.keys.length} 个键`);
        for (const key of list.keys) {
          const userData = await context.USERS_KV.get(key.name);
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              if (!parsed.id || !parsed.name || !parsed.email) {
                console.error(`键 ${key.name} 的用户数据无效`, parsed);
                continue;
              }
              users.push(parsed);
            } catch (parseError) {
              console.error(`解析键 ${key.name} 的用户数据失败:`, parseError);
            }
          } else {
            console.log(`键 ${key.name} 无数据`);
          }
        }
        console.log(`返回 ${users.length} 个用户`);
        return users;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        throw new Error(`获取用户列表失败: ${error.message}`);
      }
    },
  },
  Mutation: {
    createUser: async (
      _: unknown,
      { input }: CreateUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User> => {
      try {
        if (!context.USERS_KV) {
          console.error('USERS_KV 未定义');
          throw new Error('KV 命名空间未绑定');
        }
        const id = crypto.randomUUID();
        const user: User = { id, ...input };
        await context.USERS_KV.put(`user:${id}`, JSON.stringify(user));
        console.log(`创建用户 ID: ${id}`);
        return user;
      } catch (error) {
        console.error('创建用户失败:', error);
        throw new Error(`创建用户失败: ${error.message}`);
      }
    },
    updateUser: async (
      _: unknown,
      { id, input }: UpdateUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<User> => {
      try {
        if (!context.USERS_KV) {
          console.error('USERS_KV 未定义');
          throw new Error('KV 命名空间未绑定');
        }
        const userData = await context.USERS_KV.get(`user:${id}`);
        if (!userData) {
          console.error(`未找到 ID 为 ${id} 的用户`);
          throw new Error('用户不存在');
        }
        const parsed = JSON.parse(userData);
        const updatedUser: User = { ...parsed, ...input, id };
        await context.USERS_KV.put(`user:${id}`, JSON.stringify(updatedUser));
        console.log(`更新用户 ID: ${id}`);
        return updatedUser;
      } catch (error) {
        console.error(`更新用户 ID ${id} 失败:`, error);
        throw new Error(`更新用户失败: ${error.message}`);
      }
    },
    deleteUser: async (
      _: unknown,
      { id }: DeleteUserArgs,
      context: { USERS_KV: KVNamespace },
      info: GraphQLResolveInfo
    ): Promise<boolean> => {
      try {
        if (!context.USERS_KV) {
          console.error('USERS_KV 未定义');
          throw new Error('KV 命名空间未绑定');
        }
        const userData = await context.USERS_KV.get(`user:${id}`);
        if (!userData) {
          console.log(`未找到 ID 为 ${id} 的用户`);
          return false;
        }
        await context.USERS_KV.delete(`user:${id}`);
        console.log(`删除用户 ID: ${id}`);
        return true;
      } catch (error) {
        console.error(`删除用户 ID ${id} 失败:`, error);
        throw new Error(`删除用户失败: ${error.message}`);
      }
    },
  },
};

export const schema = createSchema({
  typeDefs: combinedTypeDefs,
  resolvers,
});