import { createYoga } from 'graphql-yoga';
import { schema } from './schema';

// 创建 GraphQL 服务器实例，处理所有请求
const yoga = createYoga({
  schema,                           // 导入统一的 schema
  graphqlEndpoint: '/graphql',      // 定义 GraphQL API 端点路径
  cors: {
    origin: ['http://localhost:3000','https://web3uniadmin.pages.dev'],
    credentials: true,
    allowedHeaders: ['Content-Type'],
    methods: ['POST', 'GET', 'OPTIONS'],
  },
});

// Cloudflare Worker 的 fetch 事件处理函数
export default {
  fetch: yoga.fetch,               // 将请求交给 yoga 处理
};