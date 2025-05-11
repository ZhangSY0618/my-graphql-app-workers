// src/index.ts
import { createYoga } from 'graphql-yoga';
import { schema } from './schema';

// 使用 createYoga 创建 GraphQL 服务器实例
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql', // 定义 GraphQL API 的端点路径，默认为 /graphql
});

// Cloudflare Worker 的 fetch 事件处理函数
export default {
  fetch: yoga.fetch,
};