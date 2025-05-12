// 共享的 GraphQL 类型定义
export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!           #  # 用户唯一标识
    name: String!     # 用户姓名
    email: String!    # 用户邮箱
  }

  input UserInput {
    name: String!     # 创建或更新用户时的姓名输入
    email: String!    # 创建或更新用户时的邮箱输入
  }
`;

// 用户接口定义
export interface User {
  id: string;         // 用户 ID
  name: string;       // 用户姓名
  email: string;      // 用户邮箱
}

// 用户输入接口定义
export interface UserInput {
  name: string;       // 输入的姓名
  email: string;      // 输入的邮箱
}