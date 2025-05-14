import { createSchema, createYoga } from 'graphql-yoga';
import { KVNamespace } from '@cloudflare/workers-types';

declare global {
  const MY_LIST_KV: KVNamespace;
}
// 定义 TypeScript 类型
interface Item {
  id: string;
  text: string;
}
const typeDefs = /* GraphQL */ `
  type Item {
    id: ID!
    text: String!
  }

  type Query {
    hello: String!
    getItems: [Item!]!
  }

  type Mutation {
    addItem(text: String!): Item!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello World!', // 保留 hello 查询
    getItems: async (): Promise<Item[]> => {
      console.log('开始获取 items...');
      try {
        if (!MY_LIST_KV) {
          throw new Error('MY_LIST_KV 未定义，请检查 wrangler.toml 配置');
        }
        const rawItems = await MY_LIST_KV.get('items', { type: 'json' });
        console.log('从 KV 获取的原始数据:', rawItems);
        if (!rawItems || !Array.isArray(rawItems)) {
          console.log('数据无效或为空，返回空数组');
          return [];
        }
        const items: Item[] = rawItems.filter((item: any) => 
          typeof item === 'object' && 
          typeof item.id === 'string' && 
          typeof item.text === 'string'
        );
        console.log('过滤后的 items:', items);
        return items;
      } catch (error: any) {
        console.error('获取 items 失败:', error);
        throw new Error(`无法获取列表项: ${error.message}`);
      }
    },
  },
  Mutation: {
    addItem: async (_: unknown, { text }: { text: string }): Promise<Item> => {
      try {
        const items: Item[] = (await MY_LIST_KV.get('items', { type: 'json' })) || [];
        const newItem: Item = { id: Date.now().toString(), text };
        items.push(newItem);
        await MY_LIST_KV.put('items', JSON.stringify(items));
        return newItem;
      } catch (error: any) {
        console.error('添加 item 失败:', error);
        throw new Error(`无法添加列表项: ${error.message}`);
      }
    },
  },
};
const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/graphql',
  cors: {
    origin: ['http://localhost:3000','https://web3uniadmin.pages.dev'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  },
});

export default {
  fetch: yoga.fetch
};